import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { JSDOM } from "jsdom";
import nodeCanvas from "canvas";
import type { Options } from "qr-code-styling";
import { serialize } from "@/lib/utils";
import { resolveSafeServerLogoSrc } from "@/lib/storage";
import type { QR, QrBorderSettings, QrRenderConfig, QrStyleSettings, QRData } from "@/lib/types";

const SVG_MODULE_PATH = "qr-code-styling/lib/qr-code-styling.common.js";
type RenderWindow = InstanceType<typeof JSDOM>["window"];

export class UnsafeServerLogoSourceError extends Error {
  constructor() {
    super("Logo source must be a data URL, app-hosted asset, or allowlisted host");
    this.name = "UnsafeServerLogoSourceError";
  }
}

function buildGradient(colorType: "solid" | "gradient" | undefined, colors: string[] | undefined, type: "linear" | "radial" | undefined, rotation = 0) {
  const color0 = colors?.[0] ?? "#000000";
  const color1 = colors?.[1] ?? color0;

  if (colorType !== "gradient") {
    return { color: color0 };
  }

  return {
    color: color0,
    gradient: {
      type: type ?? "linear",
      rotation,
      colorStops: [
        { offset: 0, color: color0 },
        { offset: 1, color: color1 },
      ],
    },
  };
}

function toRenderData(qr: QR | QRData | string) {
  if (typeof qr === "string") {
    return qr;
  }

  if ("code" in qr) {
    return qr.publicUrl ?? serialize(qr.data);
  }

  return serialize(qr);
}

function buildOptions(data: string, config: QrRenderConfig, jsdomClass: typeof JSDOM): Options {
  const styleSettings: QrStyleSettings = config.styleSettings ?? {};
  const width = config.width ?? 512;
  const height = config.height ?? 512;
  const image = resolveSafeServerLogoSrc(config.logoSettings?.src);

  if (config.logoSettings?.src && !image) {
    throw new UnsafeServerLogoSourceError();
  }

  return {
    jsdom: jsdomClass,
    nodeCanvas,
    width,
    height,
    margin: config.margin ?? 4,
    type: "svg",
    data,
    image,
    shape: config.borderSettings?.shape ?? "square",
    qrOptions: {
      errorCorrectionLevel: config.errorLevel ?? "M",
    },
    dotsOptions: {
      type: styleSettings.dotStyle ?? "square",
      ...buildGradient(styleSettings.dotColorType, styleSettings.dotColors, styleSettings.dotGradientType, styleSettings.dotRotation),
    },
    cornersSquareOptions: {
      type: styleSettings.eyeStyle ?? "square",
      ...buildGradient(styleSettings.eyeColorType, styleSettings.eyeColors, styleSettings.eyeGradientType, styleSettings.eyeRotation),
    },
    ...(styleSettings.innerEyeStyle && styleSettings.innerEyeStyle !== "none"
      ? {
          cornersDotOptions: {
            type: styleSettings.innerEyeStyle,
            ...buildGradient(
              styleSettings.innerEyeColorType,
              styleSettings.innerEyeColors,
              styleSettings.innerEyeGradientType,
              styleSettings.innerEyeRotation,
            ),
          },
        }
      : {}),
    backgroundOptions: buildGradient(
      styleSettings.bgColorType,
      styleSettings.bgColors,
      styleSettings.bgGradientType,
      styleSettings.bgRotation,
    ),
    imageOptions: config.logoSettings
      ? {
          hideBackgroundDots: config.logoSettings.hideBackgroundDots ?? true,
          saveAsBlob: true,
          imageSize: config.logoSettings.size,
          margin: config.logoSettings.margin ?? 4,
          crossOrigin: "anonymous",
        }
      : undefined,
  };
}

function applyFrameExtension(window: RenderWindow, svg: SVGElement, width: number, height: number, settings: QrBorderSettings) {
  const ns = "http://www.w3.org/2000/svg";
  const size = Math.min(width, height);
  const stroke = settings.colors[0] ?? "#111827";

  const addText = () => {
    if (!settings.text) {
      return;
    }

    const textEl = window.document.createElementNS(ns, "text");
    textEl.setAttribute("x", `${width / 2}`);
    textEl.setAttribute("y", `${height - 20}`);
    textEl.setAttribute("fill", stroke);
    textEl.setAttribute("font-size", "16");
    textEl.setAttribute("text-anchor", "middle");
    textEl.textContent = settings.text;
    svg.appendChild(textEl);
  };

  const rect = window.document.createElementNS(ns, "rect");
  rect.setAttribute("fill", "none");
  rect.setAttribute("stroke", stroke);

  switch (settings.preset) {
    case "rounded":
      rect.setAttribute("x", `${(width - size + 40) / 2}`);
      rect.setAttribute("y", `${(height - size + 40) / 2}`);
      rect.setAttribute("width", `${size - 40}`);
      rect.setAttribute("height", `${size - 40}`);
      rect.setAttribute("stroke-width", "20");
      rect.setAttribute("rx", "20");
      break;
    case "double": {
      [4, 12].forEach((offset) => {
        const duplicate = window.document.createElementNS(ns, "rect");
        duplicate.setAttribute("fill", "none");
        duplicate.setAttribute("stroke", stroke);
        duplicate.setAttribute("x", `${(width - size) / 2 + offset}`);
        duplicate.setAttribute("y", `${(height - size) / 2 + offset}`);
        duplicate.setAttribute("width", `${size - offset * 2}`);
        duplicate.setAttribute("height", `${size - offset * 2}`);
        duplicate.setAttribute("stroke-width", "4");
        svg.appendChild(duplicate);
      });
      addText();
      return;
    }
    case "dashed":
      rect.setAttribute("x", `${(width - size) / 2}`);
      rect.setAttribute("y", `${(height - size) / 2}`);
      rect.setAttribute("width", `${size}`);
      rect.setAttribute("height", `${size}`);
      rect.setAttribute("stroke-width", "4");
      rect.setAttribute("stroke-dasharray", "8,4");
      rect.setAttribute("rx", "8");
      break;
    default:
      rect.setAttribute("x", `${(width - size) / 2}`);
      rect.setAttribute("y", `${(height - size) / 2}`);
      rect.setAttribute("width", `${size}`);
      rect.setAttribute("height", `${size}`);
      rect.setAttribute("stroke-width", "10");
      rect.setAttribute("rx", settings.shape === "circle" ? `${size / 2}` : "0");
      break;
  }

  svg.appendChild(rect);
  addText();
}

function composeFramedSvg(window: RenderWindow, qrSvgText: string, frameSvgText: string, width: number, settings: QrBorderSettings) {
  const parser = new window.DOMParser();
  const serializer = new window.XMLSerializer();
  const qrDoc = parser.parseFromString(qrSvgText, "image/svg+xml");
  const frameDoc = parser.parseFromString(frameSvgText, "image/svg+xml");

  const qrSvg = qrDoc.querySelector("svg");
  const frameSvg = frameDoc.querySelector("svg");
  if (!qrSvg || !frameSvg) {
    return qrSvgText;
  }

  const qrGroup = frameSvg.querySelector('g[id="_--QR--"], g[serif\\:id="{{QR}}"]');
  if (qrGroup) {
    const rect = qrGroup.querySelector("rect");
    const targetW = rect?.getAttribute("width") ?? String(width);
    const targetH = rect?.getAttribute("height") ?? String(width);
    qrGroup.innerHTML = "";
    qrSvg.setAttribute("width", targetW);
    qrSvg.setAttribute("height", targetH);
    qrSvg.setAttribute("x", "0");
    qrSvg.setAttribute("y", "0");
    Array.from(qrSvg.childNodes).forEach((node) => {
      qrGroup.appendChild(frameDoc.importNode(node, true));
    });
  }

  if (settings.text) {
    const textGroup = frameSvg.querySelector('g[id="_--TEXT--"], g[serif\\:id="{{TEXT}}"]');
    const textEl = textGroup?.querySelector("text");
    if (textGroup && textEl) {
      const textRect = textGroup.querySelector("rect");
      if (textRect) {
        const boxX = Number.parseFloat(textRect.getAttribute("x") ?? "0");
        const boxY = Number.parseFloat(textRect.getAttribute("y") ?? "0");
        const boxW = Number.parseFloat(textRect.getAttribute("width") ?? "0");
        const boxH = Number.parseFloat(textRect.getAttribute("height") ?? "0");
        let styleAttr = textEl.getAttribute("style") || "";
        styleAttr = styleAttr.replace(/font-size:[^;]+;?/i, "");
        textGroup.innerHTML = "";
        const newText = frameDoc.createElementNS("http://www.w3.org/2000/svg", "text");
        newText.setAttribute("style", `${styleAttr}font-size:${boxH}pt;`);
        newText.setAttribute("x", `${boxX + boxW / 2}`);
        newText.setAttribute("y", `${boxY + boxH / 2}`);
        newText.setAttribute("text-anchor", "middle");
        newText.setAttribute("dominant-baseline", "middle");
        newText.textContent = settings.text;
        textGroup.appendChild(newText);
      }
    }
  }

  return serializer.serializeToString(frameSvg);
}

async function loadQRCodeStyling() {
  const qrCodeStylingModule = await import(SVG_MODULE_PATH);
  return qrCodeStylingModule.default;
}

function svgToPngBuffer(svgText: string, width: number, height: number) {
  const canvas = nodeCanvas.createCanvas(width, height);
  return nodeCanvas.loadImage(`data:image/svg+xml;base64,${Buffer.from(svgText).toString("base64")}`).then((image) => {
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, width, height);
    return canvas.toBuffer("image/png");
  });
}

export async function renderQRCodeBinary(
  qr: QR | QRData | string,
  config: QrRenderConfig,
  format: "svg" | "png" = "svg",
): Promise<{ contentType: string; body: Buffer }> {
  const QRCodeStyling = await loadQRCodeStyling();
  const data = toRenderData(qr);
  const width = config.width ?? 512;
  const height = config.height ?? 512;
  const options = buildOptions(data, config, JSDOM);
  const qrCode = new QRCodeStyling(options);

  const raw = await qrCode.getRawData("svg");
  let svgText = Buffer.isBuffer(raw) ? raw.toString("utf8") : raw?.toString() ?? "";

  const borderSettings = config.borderSettings;
  if (borderSettings) {
    if (borderSettings.preset === "custom-svg") {
      const frameSvg = await readFile(path.join(process.cwd(), "public", "frame-2.svg"), "utf8");
      svgText = composeFramedSvg(new JSDOM("").window, svgText, frameSvg, width, borderSettings);
    } else {
      const window = new JSDOM("").window;
      const parser = new window.DOMParser();
      const serializer = new window.XMLSerializer();
      const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
      const svgEl = svgDoc.querySelector("svg");
      if (svgEl) {
        applyFrameExtension(window, svgEl, width, height, borderSettings);
        svgText = serializer.serializeToString(svgEl);
      }
    }
  }

  if (format === "png") {
    return {
      contentType: "image/png",
      body: await svgToPngBuffer(svgText, width, height),
    };
  }

  return {
    contentType: "image/svg+xml",
    body: Buffer.from(svgText, "utf8"),
  };
}
