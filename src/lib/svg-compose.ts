// Use browser's built-in DOMParser and XMLSerializer

/**
 * Merge two SVG strings into one, by:
 *  - Replacing the QR placeholder group
 *  - Optionally replacing and fitting text in the TEXT placeholder
 */
export function composeFramedSvg(
    qrSvgText: string,
    frameSvgText: string,
    options: {
      qrSize: number;
      text?: string;
      borderSettings?: {
        colorType: "solid" | "gradient";
        colors: string[];
        gradientType?: "linear" | "radial";
        rotation?: number;
      };
    }
  ): string {
    const parser = new DOMParser();
    const serializer = new XMLSerializer();
  
    // Parse input SVGs
    const qrDoc = parser.parseFromString(qrSvgText, "image/svg+xml");
    const frameDoc = parser.parseFromString(frameSvgText, "image/svg+xml");
  
    const qrSvg = qrDoc.querySelector("svg")!;
    const frameSvg = frameDoc.querySelector("svg")!;
  
    // === QR Replacement ===
    const qrGroup = frameSvg.querySelector('g[id="_--QR--"], g[serif\\:id="{{QR}}"]');
    if (qrGroup) {
      const rect = qrGroup.querySelector("rect");
      const targetW = rect?.getAttribute("width") ?? String(options.qrSize);
      const targetH = rect?.getAttribute("height") ?? String(options.qrSize);
      qrGroup.innerHTML = "";
      qrSvg.setAttribute("width", targetW);
      qrSvg.setAttribute("height", targetH);
      qrSvg.setAttribute("x", "0");
      qrSvg.setAttribute("y", "0");
      Array.from(qrSvg.childNodes).forEach(node => {
        const imported = frameDoc.importNode(node, true);
        qrGroup.appendChild(imported);
      });
    }
  
    // === TEXT Replacement/Fitting ===
    if (options.text != null && options.text.length > 0) {
      const textGroup = frameSvg.querySelector('g[id="_--TEXT--"], g[serif\\:id="{{TEXT}}"]');
      const textEl    = textGroup?.querySelector("text");
      if (textGroup && textEl) {
        // capture template properties
        const textRect = textGroup.querySelector("rect")!;
        const boxX   = parseFloat(textRect.getAttribute("x")!);
        const boxY   = parseFloat(textRect.getAttribute("y")!);
        const boxW   = parseFloat(textRect.getAttribute("width")!);
        const boxH   = parseFloat(textRect.getAttribute("height")!);

        // Grab the style minus the old font-size
        let styleAttr = textEl.getAttribute("style") || "";
        styleAttr = styleAttr.replace(/font-size:[^;]+;?/i, "");

        // Clear out the group
        textGroup.innerHTML = "";

        // Build a new <text> that fills both width and height, centered and aspect-correct
        const ns = "http://www.w3.org/2000/svg";
        const newText = frameDoc.createElementNS(ns, "text");
        // Set font-size to fit box height
        newText.setAttribute("style", `${styleAttr}font-size:${boxH}pt;`);
        // Center horizontally and vertically
        const centerX = boxX + boxW / 2;
        const centerY = boxY + boxH / 2;
        newText.setAttribute("x", centerX.toString());
        newText.setAttribute("y", centerY.toString());
        newText.setAttribute("text-anchor", "middle");
        newText.setAttribute("dominant-baseline", "middle");
        newText.textContent = options.text;

        textGroup.appendChild(newText);
      }
    }
  
    // === FRAME Styling via borderSettings ===
    if (options.borderSettings && !(options.borderSettings.colorType === "solid" && options.borderSettings.colors.length === 2)) {
      const { colorType, colors, gradientType } = options.borderSettings;
      const frameGroup = frameSvg.querySelector('g[id="_--FRAME--"], g[serif\\:id="{{FRAME}}"]');
      if (frameGroup) {
        if (colorType === "solid") {
          // Apply solid fill color
          const fillColor = colors[0];
          frameGroup.querySelectorAll<SVGPathElement>("path").forEach(path => {
            // merge into existing style
            const existing = path.getAttribute("style") || "";
            const newStyle = existing.replace(/fill:[^;]+;?/, "") + `fill:${fillColor};`;
            path.setAttribute("style", newStyle);
          });
        } else if (colorType === "gradient") {
          // Create or reuse a gradient definition
          const gradId = `border-gradient`;
          // Remove existing def if present
          frameSvg.querySelector(`defs #${gradId}`)?.remove();
          // Build gradient element
          const defs = frameDoc.querySelector("defs") || frameDoc.createElementNS("http://www.w3.org/2000/svg", "defs");
          if (!defs.parentNode) frameSvg.insertBefore(defs, frameSvg.firstChild);
          const grad = frameDoc.createElementNS("http://www.w3.org/2000/svg", gradientType + "Gradient");
          grad.setAttribute("id", gradId);
          grad.setAttribute("gradientUnits", "userSpaceOnUse");
          grad.setAttribute("gradientTransform", `${gradientType}-gradient`); // placeholder
          // Set stops
          colors.forEach((col, i) => {
            const stop = frameDoc.createElementNS("http://www.w3.org/2000/svg", "stop");
            stop.setAttribute("offset", `${(i/(colors.length-1))*100}%`);
            stop.setAttribute("style", `stop-color:${col};stop-opacity:1`);
            grad.appendChild(stop);
          });
          defs.appendChild(grad);
          // Apply fill to paths
          frameGroup.querySelectorAll<SVGPathElement>("path").forEach(path => {
            const existing = path.getAttribute("style") || "";
            const newStyle = existing.replace(/fill:[^;]+;?/, "") + `fill:url(#${gradId});`;
            path.setAttribute("style", newStyle);
          });
        }
      }
    }
  
    return serializer.serializeToString(frameSvg);
  }