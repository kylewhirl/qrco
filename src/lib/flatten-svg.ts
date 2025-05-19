/**
 * Flattens an SVG element by expanding clipPaths and inlining embedded images,
 * then triggers a download of the resulting SVG.
 * @param svgElement The source SVGSVGElement to flatten.
 * @param filename The name for the downloaded file (defaults to "qr-code.svg").
 */
export async function flattenAndDownloadSvg(
  svgElement: SVGSVGElement,
  filename = "qr-code.svg"
): Promise<void> {
  // Serialize current SVG
  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(svgElement);

  // Flatten clipPaths by expanding each <rect> inside <defs><clipPath> into the root SVG
  const parser = new DOMParser();
  const doc = parser.parseFromString(source, "image/svg+xml");
  const svgRoot = doc.documentElement;

  // Capture gradient definitions for linear and radial gradients, including background-color
  const gradientDefs: Element[] = [];
  doc.querySelectorAll(
    'defs linearGradient[id^="dot-color"], defs linearGradient[id^="corners-square-color"], defs linearGradient[id^="corners-dot-color"], defs linearGradient[id^="background-color"], defs linearGradient[id^="border-gradient"], ' +
    'defs radialGradient[id^="dot-color"], defs radialGradient[id^="corners-square-color"], defs radialGradient[id^="corners-dot-color"], defs radialGradient[id^="background-color"], defs radialGradient[id^="border-gradient"]'
  ).forEach(grad => {
    gradientDefs.push(grad.cloneNode(true) as Element);
  });

  // Normalize stop colors: split RGBA into stop-color and stop-opacity
  gradientDefs.forEach(def => {
    def.querySelectorAll<SVGStopElement>("stop").forEach(stop => {
      const scRaw = stop.getAttribute("stop-color") || stop.getAttribute("style")?.match(/stop-color:([^;]+)/i)?.[1] || "";
      const sc = scRaw.trim();
      const rgbRegex = /rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/i;
      const match = sc.match(rgbRegex);
      if (match) {
        const [, r, g, b, a] = match;
        const opacity = a !== undefined ? a : "1";
        // Set unified style for color and opacity
        stop.setAttribute(
          "style",
          `stop-color:rgb(${r},${g},${b});stop-opacity:${opacity}`
        );
        stop.removeAttribute("stop-color");
        stop.removeAttribute("stop-opacity");
      }
    });
  });

  // Map each clipPath ID to its corresponding fill value
  const fillMap: Record<string, string> = {};
  doc.querySelectorAll<SVGRectElement>('rect[clip-path]').forEach(r => {
    const cp = r.getAttribute('clip-path');
    const fill = r.getAttribute('fill') || '';
    if (cp) {
      // extract id from url('#id')
      const match = cp.match(/url\(['"]?#([^'")]+)['"]?\)/);
      if (match) fillMap[match[1]] = fill;
    }
  });

  // Clone shapes (rects, paths, and circles) from clipping paths for background, dots, and corners
  const clonedShapes: (SVGRectElement | SVGPathElement | SVGCircleElement)[] = [];
  doc.querySelectorAll(
    'defs clipPath[id^="clip-path-background-color"], defs clipPath[id^="clip-path-dot-color"], defs clipPath[id^="clip-path-corners"], defs clipPath[id^="clip-path-corners-dot-color"]'
  ).forEach(cp => {
    // Preserve transform from clipPath element
    const cpTransform = cp.getAttribute("transform") || "";
    // clone background rects
    cp.querySelectorAll("rect").forEach(rect => {
      clonedShapes.push(rect.cloneNode(true) as SVGRectElement);
      const cloneIndex = clonedShapes.length - 1;
      if (cpTransform) {
        const existing = clonedShapes[cloneIndex].getAttribute("transform");
        clonedShapes[cloneIndex].setAttribute(
          "transform",
          `${cpTransform}${existing ? " " + existing : ""}`
        );
      }
      // Set fill from fillMap
      const fillValue = fillMap[cp.id] || '';
      (clonedShapes[cloneIndex]).setAttribute('fill', fillValue);
    });
    // clone any paths (for square corner shapes)
    cp.querySelectorAll("path").forEach(path => {
      clonedShapes.push(path.cloneNode(true) as SVGPathElement);
      const cloneIndex = clonedShapes.length - 1;
      if (cpTransform) {
        const existing = clonedShapes[cloneIndex].getAttribute("transform");
        clonedShapes[cloneIndex].setAttribute(
          "transform",
          `${cpTransform}${existing ? " " + existing : ""}`
        );
      }
      const fillValue = fillMap[cp.id] || '';
      (clonedShapes[cloneIndex]).setAttribute('fill', fillValue);
    });
    // clone circles (for round dots)
    cp.querySelectorAll("circle").forEach(circle => {
      clonedShapes.push(circle.cloneNode(true) as SVGCircleElement);
      const cloneIndex = clonedShapes.length - 1;
      if (cpTransform) {
        const existing = clonedShapes[cloneIndex].getAttribute("transform");
        clonedShapes[cloneIndex].setAttribute(
          "transform",
          `${cpTransform}${existing ? " " + existing : ""}`
        );
      }
      const fillValue = fillMap[cp.id] || '';
      (clonedShapes[cloneIndex]).setAttribute('fill', fillValue);
    });
  });

  // Remove all elements that used clipPaths (they’ll be replaced) and remove original defs
  svgRoot.querySelectorAll("[clip-path]").forEach(el => el.remove());
  svgRoot.querySelector("defs")?.remove();

  // Reinsert gradient definitions
  if (gradientDefs.length) {
    const newDefs = doc.createElementNS("http://www.w3.org/2000/svg", "defs");
    gradientDefs.forEach(g => newDefs.appendChild(g));
    svgRoot.insertBefore(newDefs, svgRoot.firstChild);
  }

  // Reinsert QR shapes into the proper group (or fallback to root)
  const qrGroup = doc.querySelector('g[id="_--QR--"], g[serif\\:id="{{QR}}"]');
  if (qrGroup) {
    // Remove any placeholder rect inside
    qrGroup.querySelectorAll("rect").forEach(r => r.remove());
  }

  const target = qrGroup || svgRoot;
  clonedShapes.forEach(shape => {
    target.appendChild(shape);
  });

  // Inline any base64-encoded SVG <image> tags
  doc.querySelectorAll('image').forEach(img => {
    const href = img.getAttribute('href') || img.getAttribute('xlink:href');
    if (href?.startsWith('data:image/svg+xml;base64,')) {
      const b64 = href.split(',')[1];
      const svgText = atob(b64);
      const imgDoc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
      const children = Array.from(imgDoc.documentElement.childNodes);
      const svgEl = imgDoc.documentElement;
      // Attributes from original <svg> to carry over
      const styleAttrs = ['stroke','stroke-width','stroke-linecap','stroke-linejoin','fill','fill-opacity'];
      // Compute translation from x/y and scaling from width/height vs. viewBox
      const tx = parseFloat(img.getAttribute('x') || '0');
      const ty = parseFloat(img.getAttribute('y') || '0');
      const widthAttr = img.getAttribute('width') || '';
      const heightAttr = img.getAttribute('height') || '';
      const targetW = parseFloat(widthAttr);
      const targetH = parseFloat(heightAttr);
      // Extract viewBox dimensions from embedded SVG
      const vb = svgEl.getAttribute('viewBox')?.split(' ') || ['0','0','0','0'];
      const vbW = parseFloat(vb[2]) || targetW;
      const vbH = parseFloat(vb[3]) || targetH;
      const scaleX = targetW && vbW ? targetW / vbW : 1;
      const scaleY = targetH && vbH ? targetH / vbH : 1;
      // Create group with translation and scaling
      const group = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('transform', `translate(${tx},${ty}) scale(${scaleX},${scaleY})`);
      // Import and style each child node
      children.forEach(node => {
        const imported = doc.importNode(node, true) as Element;
        styleAttrs.forEach(attr => {
          const val = svgEl.getAttribute(attr);
          if (val && !imported.hasAttribute(attr)) {
            imported.setAttribute(attr, val);
          }
        });
        group.appendChild(imported);
      });
      // If a QR placeholder group exists, insert logo there; otherwise, to root
      const qrGroupForImage = doc.querySelector('g[id="_--QR--"], g[serif\\:id="{{QR}}"]');
      if (qrGroupForImage) {
        qrGroupForImage.appendChild(group);
      } else {
        svgRoot.appendChild(group);
      }
      img.remove();
    }
  });

  // Normalize stroke RGBA to separate stroke and stroke-opacity attributes
  doc.querySelectorAll<SVGElement>('[stroke^="rgba"]').forEach(el => {
    const rgba = el.getAttribute('stroke')!;
    const match = rgba.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\s*\)/i);
    if (match) {
      const [, r, g, b, a] = match;
      el.setAttribute('stroke', `rgb(${r}, ${g}, ${b})`);
      el.setAttribute('stroke-opacity', a);
    }
  });

  // Normalize fill RGBA to separate stroke and stroke-opacity attributes
  doc.querySelectorAll<SVGElement>('[fill^="rgba"]').forEach(el => {
    const rgba = el.getAttribute('fill')!;
    const match = rgba.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\s*\)/i);
    if (match) {
      const [, r, g, b, a] = match;
      el.setAttribute('fill', `rgb(${r}, ${g}, ${b})`);
      el.setAttribute('fill-opacity', a);
    }
  });

  // Normalize inline style fill:rgba(...) into fill + fill-opacity
doc.querySelectorAll<SVGElement>('[style*="fill:rgba"]').forEach(el => {
  const style = el.getAttribute("style")!;
  // extract the rgba(...) chunk
  const match = style.match(/fill:\s*rgba?\(\s*(\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\s*\)/i);
  if (match) {
    const [, r, g, b, a] = match;
    // remove the rgba() from style
    const cleaned = style.replace(/fill:\s*rgba?\([^\)]+\);?/, "");
    // set fill and fill-opacity attributes
    el.setAttribute("style", cleaned);
    el.setAttribute("fill", `rgb(${r}, ${g}, ${b})`);
    el.setAttribute("fill-opacity", a);
  }
});

  // Serialize flattened SVG
  const flattened = new XMLSerializer().serializeToString(doc);

  // Trigger download
  const blob = new Blob([flattened], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}