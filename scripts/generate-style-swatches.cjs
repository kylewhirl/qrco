const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const { QRCodeStyling } = require("qr-code-styling/lib/qr-code-styling.common.js");

const outDir = path.join(process.cwd(), "public", "qr-style-swatches");

const DOT_STYLE_OPTIONS = [
  "square",
  "dots",
  "rounded",
  "extra-rounded",
  "classy",
  "classy-rounded",
];

const EYE_STYLE_OPTIONS = [
  "square",
  "extra-rounded",
  "dot",
  "rounded",
  "classy",
  "classy-rounded",
  "dots",
];

const INNER_EYE_STYLE_OPTIONS = [
  "square",
  "dot",
  "rounded",
  "extra-rounded",
  "classy",
  "classy-rounded",
  "dots",
];

const SWATCH_DATA = "https://tqrco.test/style-preview-swatch-example";
const SWATCH_MODULE_COUNT = 33;
const SWATCH_CANVAS_SIZE = 132;
const SWATCH_TILE_SIZE = 48;
const SWATCH_PADDING_MODULES = 1;
const SVG_NS = "http://www.w3.org/2000/svg";

function buildSwatchOptions(kind, style) {
  return {
    jsdom: JSDOM,
    type: "svg",
    width: SWATCH_CANVAS_SIZE,
    height: SWATCH_CANVAS_SIZE,
    data: SWATCH_DATA,
    margin: 0,
    qrOptions: {
      errorCorrectionLevel: "M",
    },
    backgroundOptions: {
      color: "#ffffff",
    },
    dotsOptions: {
      color: "#111111",
      type: kind === "dots" ? style : "square",
    },
    cornersSquareOptions: {
      color: "#111111",
      type: kind === "eyes" ? style : "square",
    },
    cornersDotOptions: {
      color: "#111111",
      type: kind === "innerEyes" ? style : "square",
    },
  };
}

function getSwatchCrop(kind) {
  if (kind === "dots") {
    return { x: 15, y: 15, size: 3 };
  }

  if (kind === "eyes") {
    return { x: 0, y: 0, size: 7 };
  }

  return { x: 2, y: 2, size: 3 };
}

function getCropBounds(crop) {
  const moduleSize = SWATCH_CANVAS_SIZE / SWATCH_MODULE_COUNT;
  return {
    x: crop.x * moduleSize,
    y: crop.y * moduleSize,
    size: crop.size * moduleSize,
  };
}

function getElementAnchor(node) {
  if (node.tagName === "rect") {
    const x = Number(node.getAttribute("x") || 0);
    const y = Number(node.getAttribute("y") || 0);
    const width = Number(node.getAttribute("width") || 0);
    const height = Number(node.getAttribute("height") || 0);
    return { x: x + width / 2, y: y + height / 2 };
  }

  const transform = node.getAttribute("transform") || "";
  const rotateMatch = transform.match(/rotate\([^,]+,\s*([^,]+),\s*([^)]+)\)/);
  if (rotateMatch) {
    return {
      x: Number(rotateMatch[1]),
      y: Number(rotateMatch[2]),
    };
  }

  const pathMatch = (node.getAttribute("d") || "").match(/M\s*([0-9.]+)\s+([0-9.]+)/);
  if (pathMatch) {
    return {
      x: Number(pathMatch[1]) + 2,
      y: Number(pathMatch[2]) + 2,
    };
  }

  return null;
}

function nodeWithinBounds(node, bounds) {
  const anchor = getElementAnchor(node);
  if (!anchor) {
    return false;
  }

  return (
    anchor.x >= bounds.x &&
    anchor.x < bounds.x + bounds.size &&
    anchor.y >= bounds.y &&
    anchor.y < bounds.y + bounds.size
  );
}

function findSourceClipPath(svg, kind) {
  const clipPaths = Array.from(svg.querySelectorAll("clipPath"));

  if (kind === "dots") {
    return clipPaths.find((node) => (node.getAttribute("id") || "").includes("clip-path-dot-color"));
  }

  if (kind === "eyes") {
    return clipPaths.find((node) => (node.getAttribute("id") || "").includes("clip-path-corners-square-color-0-0"));
  }

  return clipPaths.find((node) => (node.getAttribute("id") || "").includes("clip-path-corners-dot-color-0-0"));
}

function setCurrentColor(node) {
  if (node.tagName !== "g") {
    node.setAttribute("fill", "currentColor");
  }

  if (node.hasAttribute("fill")) {
    node.setAttribute("fill", "currentColor");
  }

  if (node.hasAttribute("stroke")) {
    node.setAttribute("stroke", "currentColor");
  }

  Array.from(node.children).forEach((child) => setCurrentColor(child));
}

function cropSvgToStandaloneSwatch(svgText, kind, crop) {
  const dom = new JSDOM(svgText, { contentType: "image/svg+xml" });
  const sourceSvg = dom.window.document.querySelector("svg");
  if (!sourceSvg) {
    throw new Error("Failed to parse generated SVG");
  }

  const bounds = getCropBounds(crop);
  const moduleSize = SWATCH_CANVAS_SIZE / SWATCH_MODULE_COUNT;
  const padding = SWATCH_PADDING_MODULES * moduleSize;
  const sourceClipPath = findSourceClipPath(sourceSvg, kind);
  if (!sourceClipPath) {
    throw new Error(`Failed to find source clipPath for ${kind}`);
  }

  const retainedNodes = Array.from(sourceClipPath.children)
    .filter((child) => kind !== "dots" || nodeWithinBounds(child, bounds))
    .map((child) => child.cloneNode(true));

  if (retainedNodes.length === 0) {
    throw new Error(`No swatch nodes retained for ${kind}`);
  }

  const outDom = new JSDOM('<svg xmlns="http://www.w3.org/2000/svg"></svg>', { contentType: "image/svg+xml" });
  const outDoc = outDom.window.document;
  const outSvg = outDoc.querySelector("svg");
  if (!outSvg) {
    throw new Error("Failed to create output SVG");
  }

  outSvg.setAttribute("xmlns", SVG_NS);
  outSvg.setAttribute("width", String(SWATCH_TILE_SIZE));
  outSvg.setAttribute("height", String(SWATCH_TILE_SIZE));
  outSvg.setAttribute("viewBox", `0 0 ${bounds.size + padding * 2} ${bounds.size + padding * 2}`);
  outSvg.setAttribute("color", "currentColor");
  const group = outDoc.createElementNS(SVG_NS, "g");
  group.setAttribute("transform", `translate(${padding - bounds.x} ${padding - bounds.y})`);

  retainedNodes.forEach((node) => {
    const child = node;
    setCurrentColor(child);
    group.appendChild(child);
  });

  outSvg.appendChild(group);

  const output = outSvg.outerHTML;
  return `<?xml version="1.0" encoding="UTF-8"?>\n${output}\n`;
}

async function generateSwatch(kind, style) {
  const qrCode = new QRCodeStyling(buildSwatchOptions(kind, style));
  const raw = await qrCode.getRawData("svg");
  const svgText = Buffer.isBuffer(raw) ? raw.toString("utf8") : String(raw);
  const crop = getSwatchCrop(kind);
  const croppedSvg = cropSvgToStandaloneSwatch(svgText, kind, crop);
  fs.writeFileSync(path.join(outDir, `${kind}-${style}.svg`), croppedSvg);
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });

  for (const style of DOT_STYLE_OPTIONS) {
    await generateSwatch("dots", style);
  }

  for (const style of EYE_STYLE_OPTIONS) {
    await generateSwatch("eyes", style);
  }

  for (const style of INNER_EYE_STYLE_OPTIONS) {
    await generateSwatch("innerEyes", style);
  }

  console.log(`Generated swatches in ${outDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
