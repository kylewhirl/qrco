function normalizeStopColors(doc: XMLDocument) {
  doc.querySelectorAll<SVGStopElement>("stop").forEach((stop) => {
    const raw =
      stop.getAttribute("stop-color") ||
      stop.getAttribute("style")?.match(/stop-color:([^;]+)/i)?.[1] ||
      "";
    const match = raw
      .trim()
      .match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/i);

    if (!match) {
      return;
    }

    const [, r, g, b, a] = match;
    stop.setAttribute("style", `stop-color:rgb(${r},${g},${b});stop-opacity:${a ?? "1"}`);
    stop.removeAttribute("stop-color");
    stop.removeAttribute("stop-opacity");
  });
}

function normalizeRgbaAttributes(doc: XMLDocument, attribute: "fill" | "stroke") {
  doc.querySelectorAll<SVGElement>(`[${attribute}^="rgba"]`).forEach((el) => {
    const raw = el.getAttribute(attribute);
    const match = raw?.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\s*\)/i);

    if (!match) {
      return;
    }

    const [, r, g, b, a] = match;
    el.setAttribute(attribute, `rgb(${r}, ${g}, ${b})`);
    el.setAttribute(`${attribute}-opacity`, a);
  });
}

function normalizeInlineFillStyles(doc: XMLDocument) {
  doc.querySelectorAll<SVGElement>('[style*="fill:rgba"]').forEach((el) => {
    const style = el.getAttribute("style");
    const match = style?.match(/fill:\s*rgba?\(\s*(\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\s*\)/i);

    if (!style || !match) {
      return;
    }

    const [, r, g, b, a] = match;
    const cleaned = style.replace(/fill:\s*rgba?\([^)]+\);?/i, "");
    el.setAttribute("style", cleaned);
    el.setAttribute("fill", `rgb(${r}, ${g}, ${b})`);
    el.setAttribute("fill-opacity", a);
  });
}

function inlineEmbeddedSvgImages(doc: XMLDocument) {
  const svgRoot = doc.documentElement;

  doc.querySelectorAll("image").forEach((img) => {
    const href = img.getAttribute("href") || img.getAttribute("xlink:href");
    if (!href?.startsWith("data:image/svg+xml;base64,")) {
      return;
    }

    const b64 = href.split(",")[1];
    const svgText = atob(b64);
    const imgDoc = new DOMParser().parseFromString(svgText, "image/svg+xml");
    const svgEl = imgDoc.documentElement;
    const children = Array.from(svgEl.childNodes);
    const styleAttrs = ["stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "fill", "fill-opacity"];

    const tx = parseFloat(img.getAttribute("x") || "0");
    const ty = parseFloat(img.getAttribute("y") || "0");
    const targetW = parseFloat(img.getAttribute("width") || "0");
    const targetH = parseFloat(img.getAttribute("height") || "0");
    const vb = svgEl.getAttribute("viewBox")?.split(/\s+/) || ["0", "0", "0", "0"];
    const vbW = parseFloat(vb[2]) || targetW || 1;
    const vbH = parseFloat(vb[3]) || targetH || 1;
    const scaleX = targetW ? targetW / vbW : 1;
    const scaleY = targetH ? targetH / vbH : 1;

    const group = doc.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("transform", `translate(${tx},${ty}) scale(${scaleX},${scaleY})`);

    children.forEach((node) => {
      const imported = doc.importNode(node, true) as Element;
      styleAttrs.forEach((attr) => {
        const value = svgEl.getAttribute(attr);
        if (value && !imported.hasAttribute(attr)) {
          imported.setAttribute(attr, value);
        }
      });
      group.appendChild(imported);
    });

    const qrGroup = doc.querySelector('g[id="_--QR--"], g[serif\\:id="{{QR}}"]');
    (qrGroup || svgRoot).appendChild(group);
    img.remove();
  });
}

export async function prepareSvgForExport(svgElement: SVGSVGElement): Promise<string> {
  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(svgElement);
  const parser = new DOMParser();
  const doc = parser.parseFromString(source, "image/svg+xml");
  const svgRoot = doc.documentElement;

  if (!svgRoot.getAttribute("xmlns")) {
    svgRoot.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  }

  if (!svgRoot.getAttribute("xmlns:xlink")) {
    svgRoot.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  }

  normalizeStopColors(doc);
  inlineEmbeddedSvgImages(doc);
  normalizeRgbaAttributes(doc, "stroke");
  normalizeRgbaAttributes(doc, "fill");
  normalizeInlineFillStyles(doc);

  return serializer.serializeToString(doc);
}

export async function flattenAndDownloadSvg(
  svgElement: SVGSVGElement,
  filename = "qr-code.svg"
): Promise<void> {
  const exported = await prepareSvgForExport(svgElement);
  const blob = new Blob([exported], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
