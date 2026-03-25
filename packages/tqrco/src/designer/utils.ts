import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const DESIGN_ASSET_BASE_URL = "https://tqrco.de";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getContrastColor(color: string): "black" | "white" {
  let r: number, g: number, b: number;

  if (color.startsWith("#")) {
    let hex = color;
    if (hex.length === 4) {
      hex = "#" + [...hex.slice(1)].map((char) => char + char).join("");
    }
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  } else if (color.startsWith("rgb")) {
    const nums = color.match(/\d+/g);
    if (nums && nums.length >= 3) {
      [r, g, b] = nums.slice(0, 3).map((n) => parseInt(n, 10));
    } else {
      return "black";
    }
  } else {
    return "black";
  }

  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 186 ? "black" : "white";
}

export interface ParsedColorValue {
  colorType: "solid" | "gradient";
  colors: string[];
  gradientType: "linear" | "radial";
  rotation: number;
}

export function parseColorValue(
  val: string,
  current: {
    gradientType?: "linear" | "radial";
    rotation?: number;
    colors?: string[];
  } = {},
): ParsedColorValue {
  const gradientType = current.gradientType ?? "linear";
  let rotation = current.rotation ?? 0;

  if (val.startsWith("#") || val.toLowerCase().startsWith("rgb")) {
    return { colorType: "solid", colors: [val], gradientType, rotation };
  }

  if (val.startsWith("linear-gradient")) {
    const angleMatch = val.match(/^linear-gradient\((\d+)deg/);
    rotation = angleMatch ? parseInt(angleMatch[1], 10) : rotation;
    const matches = val.match(/rgba?\([^)]+\)|#[0-9A-Fa-f]{3,8}/gi) || [];
    const colors =
      matches.length >= 2
        ? matches.slice(0, 2)
        : [
            matches[0] || current.colors?.[0] || "#000",
            current.colors?.[1] || matches[0] || "#000",
          ];
    return {
      colorType: "gradient",
      colors,
      gradientType: "linear",
      rotation,
    };
  }

  if (val.startsWith("radial-gradient")) {
    const matches = val.match(/rgba?\([^)]+\)|#[0-9A-Fa-f]{3,8}/gi) || [];
    const colors =
      matches.length >= 2
        ? matches.slice(0, 2)
        : [
            matches[0] || current.colors?.[0] || "#000",
            current.colors?.[1] || matches[0] || "#000",
          ];
    return {
      colorType: "gradient",
      colors,
      gradientType: "radial",
      rotation,
    };
  }

  return { colorType: "solid", colors: [val], gradientType, rotation };
}

export function averageColors(colors: string[]): string {
  function parseColor(color: string): { r: number; g: number; b: number; a: number } {
    const normalized = color.trim().toLowerCase();

    if (normalized.startsWith("#")) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 1;

      if (normalized.length === 4) {
        r = parseInt(normalized[1] + normalized[1], 16);
        g = parseInt(normalized[2] + normalized[2], 16);
        b = parseInt(normalized[3] + normalized[3], 16);
      } else if (normalized.length === 5) {
        r = parseInt(normalized[1] + normalized[1], 16);
        g = parseInt(normalized[2] + normalized[2], 16);
        b = parseInt(normalized[3] + normalized[3], 16);
        a = parseInt(normalized[4] + normalized[4], 16) / 255;
      } else if (normalized.length === 7) {
        r = parseInt(normalized.substring(1, 3), 16);
        g = parseInt(normalized.substring(3, 5), 16);
        b = parseInt(normalized.substring(5, 7), 16);
      } else if (normalized.length === 9) {
        r = parseInt(normalized.substring(1, 3), 16);
        g = parseInt(normalized.substring(3, 5), 16);
        b = parseInt(normalized.substring(5, 7), 16);
        a = parseInt(normalized.substring(7, 9), 16) / 255;
      }

      return { r, g, b, a };
    }

    const rgbaMatch = normalized.match(/^rgba?\(([^)]+)\)$/);
    if (rgbaMatch) {
      const parts = rgbaMatch[1].split(",").map((part) => part.trim());
      const r = parseInt(parts[0], 10);
      const g = parseInt(parts[1], 10);
      const b = parseInt(parts[2], 10);
      const a = parts.length === 4 ? parseFloat(parts[3]) : 1;
      return { r, g, b, a };
    }

    return { r: 0, g: 0, b: 0, a: 1 };
  }

  if (colors.length === 1) {
    const { r, g, b, a } = parseColor(colors[0]);
    const rComp = Math.round(r * a + 255 * (1 - a));
    const gComp = Math.round(g * a + 255 * (1 - a));
    const bComp = Math.round(b * a + 255 * (1 - a));
    return `rgb(${rComp}, ${gComp}, ${bComp})`;
  }

  let rSum = 0;
  let gSum = 0;
  let bSum = 0;

  for (const color of colors) {
    const { r, g, b, a } = parseColor(color);
    const rComp = Math.round(r * a + 255 * (1 - a));
    const gComp = Math.round(g * a + 255 * (1 - a));
    const bComp = Math.round(b * a + 255 * (1 - a));
    rSum += rComp;
    gSum += gComp;
    bSum += bComp;
  }

  const len = colors.length || 1;
  return `rgb(${Math.round(rSum / len)}, ${Math.round(gSum / len)}, ${Math.round(bSum / len)})`;
}
