import React from "react";
import type { Options as QRCodeStylingOptions } from "qr-code-styling";
import Image from "next/image";

let frameDataUrlPromise: Promise<string> | null = null;
if (typeof window !== "undefined") {
  const frameUrl = "/frame-1.svg";
  frameDataUrlPromise = fetch(frameUrl)
    .then(res => res.text())
    .then(svgText => {
      // Remove XML declaration if present
      let content = svgText.replace(/<\?xml.*?\?>\s*/g, "");
      // Remove the unwanted empty <g> wrapper entirely
      content = content.replace(
        /<g\s+transform="translate\(0,0\)\s*scale\(0\.6666666666666666,0\.5\)">[\s\S]*?<\/g>/g,
        ""
      );
      // Remove any existing style, width, height, and viewBox attributes to avoid duplication
      content = content.replace(/\s(?:style|width|height|viewBox)="[^"]*"/g, "");
      // Inject style and dimension attributes into the <svg> tag
      content = content.replace(
        /<svg([^>]*)>/,
        `<svg$1 style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;" width="100%" height="100%" viewBox="0 0 384 512">`
      );
      return `data:image/svg+xml;base64,${btoa(content)}`;
    });
}

export type FramePreset = {
  id: string;
  name: string;
  preview: React.FC<{ color: string }>;  // for showing the little square in your flex-wrap
  extension: (
    svg: SVGElement,
    options: QRCodeStylingOptions,
    color: string,
    text: string
  ) => void;
};

export const framePresets: FramePreset[] = [
  {
    id: "classic",
    name: "Classic",
    preview: ({ color }) => (
      <div
        style={{
          width: 64,
          height: 64,
          border: `4px solid ${color}`,
          boxSizing: "border-box",
        }}
      />
    ),
    extension: (svg, options, color, text) => {
      const width = options.width ?? 0;
      const height = options.height ?? 0;
      const size = Math.min(width, height);
      const border = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      Object.entries({
        fill: "none",
        x: (width - size) / 2,
        y: (height - size) / 2,
        width: size,
        height: size,
        stroke: color,
        "stroke-width": 10,
        rx: 0,
      }).forEach(([k, v]) => border.setAttribute(k, v.toString()));
      svg.appendChild(border);
      const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
      textEl.setAttribute("x", `${width / 2}`);
      textEl.setAttribute("y", `${height - 20}`);
      textEl.setAttribute("fill", color);
      textEl.setAttribute("font-size", "16");
      textEl.setAttribute("text-anchor", "middle");
      textEl.textContent = text;
      svg.appendChild(textEl);
    },
  },
  {
    id: "rounded",
    name: "Rounded",
    preview: ({ color }) => (
      <div
        style={{
          width: 64,
          height: 64,
          border: `8px solid ${color}`,
          borderRadius: 16,
        }}
      />
    ),
    extension: (svg, options, color, text) => {
      const width = options.width ?? 0;
      const height = options.height ?? 0;
      const size = Math.min(width, height);
      const border = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      Object.entries({
        fill: "none",
        x: (width - size + 40) / 2,
        y: (height - size + 40) / 2,
        width: size - 40,
        height: size - 40,
        stroke: color,
        "stroke-width": 20,
        rx: 20,
      }).forEach(([k, v]) => border.setAttribute(k, v.toString()));
      svg.appendChild(border);
      const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
      textEl.setAttribute("x", `${width / 2}`);
      textEl.setAttribute("y", `${height - 20}`);
      textEl.setAttribute("fill", color);
      textEl.setAttribute("font-size", "16");
      textEl.setAttribute("font-style", "italic");
      textEl.setAttribute("text-anchor", "middle");
      textEl.textContent = text;
      svg.appendChild(textEl);
    },
  },
  {
    id: "double",
    name: "Double Line",
    preview: ({ color }) => (
      <div style={{
        width: 64, height: 64, boxSizing: "border-box",
        border: `4px solid ${color}`, padding: 4
      }}/>
    ),
    extension: (svg, options, color, text) => {
      const width = options.width ?? 0;
      const height = options.height ?? 0;
      const size = Math.min(width, height);
      [4, 12].forEach((offset) => {
        const border = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        Object.entries({
          fill: "none",
          x: (width - size) / 2 + offset,
          y: (height - size) / 2 + offset,
          width: size - offset * 2,
          height: size - offset * 2,
          stroke: color,
          "stroke-width": 4,
          rx: 0,
        }).forEach(([k, v]) => border.setAttribute(k, v.toString()));
        svg.appendChild(border);
      });
      const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
      textEl.setAttribute("x", `${width / 2}`);
      textEl.setAttribute("y", `${height - 20}`);
      textEl.setAttribute("fill", color);
      textEl.setAttribute("font-size", "14");
      textEl.setAttribute("text-anchor", "middle");
      textEl.textContent = text;
      svg.appendChild(textEl);
    },
  },
  {
    id: "dashed",
    name: "Dashed",
    preview: ({ color }) => (
      <div style={{
        width: 64, height: 64, border: `2px dashed ${color}`, boxSizing: "border-box"
      }}/>
    ),
    extension: (svg, options, color, text) => {
      const width = options.width ?? 0;
      const height = options.height ?? 0;
      const size = Math.min(width, height);
      const border = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      Object.entries({
        fill: "none",
        x: (width - size) / 2,
        y: (height - size) / 2,
        width: size,
        height: size,
        stroke: color,
        "stroke-width": 4,
        "stroke-dasharray": "8,4",
        rx: 8,
      }).forEach(([k, v]) => border.setAttribute(k, v.toString()));
      svg.appendChild(border);
      const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
      textEl.setAttribute("x", `${width / 2}`);
      textEl.setAttribute("y", `${height - 20}`);
      textEl.setAttribute("fill", color);
      textEl.setAttribute("font-size", "14");
      textEl.setAttribute("text-anchor", "middle");
      textEl.textContent = text;
      svg.appendChild(textEl);
    },
  },
  {
    id: "custom-svg",
    name: "Custom SVG",
    preview: ({ color }) => (
      <Image
        src="/frame-1.svg"
        alt="Custom SVG frame preview"
        style={{ width: 256, height: 256, objectFit: "contain", filter: `drop-shadow(0 0 0 ${color})` }}
      />
    ),
    extension: (svg, options, color, text) => {
      const width = options.width ?? 0;
      const height = options.height ?? 0;
      const imgEl = document.createElementNS("http://www.w3.org/2000/svg", "image");
      // Once we have the Base64 data URL, apply it
      if (frameDataUrlPromise) {
        frameDataUrlPromise.then(dataUrl => {
          imgEl.setAttribute("href", dataUrl);
        });
      }
      imgEl.setAttribute("x", "0");
      imgEl.setAttribute("y", "0");
      imgEl.setAttribute("width", width.toString());
      imgEl.setAttribute("height", height.toString());
      svg.appendChild(imgEl);
      // optional: add text label underneath
      const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
      textEl.setAttribute("x", `${width / 2}`);
      textEl.setAttribute("y", `${height - 20}`);
      textEl.setAttribute("fill", color);
      textEl.setAttribute("font-size", "16");
      textEl.setAttribute("text-anchor", "middle");
      textEl.textContent = text;
      svg.appendChild(textEl);
    },
  },
// …more presets…
];

export const getFrameExtension = (settings: {
  preset: string;
  color: string;
  text: string;
}) => (svg: SVGElement, options: QRCodeStylingOptions) => {
  const preset = framePresets.find((p) => p.id === settings.preset);
  if (preset) {
    preset.extension(svg, options, settings.color, settings.text);
  }
};