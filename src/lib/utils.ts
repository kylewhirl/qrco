import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { QRData } from "./types"
import { phone as Phone } from 'phone';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate a random 6-character alphanumeric code
export function generateQRCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Format date to a readable string
export function formatDate(date: Date | string | null): string {
  if (!date) return "Never"
  const d = new Date(date)
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Los_Angeles", // Adjust to your preferred timezone
  }).format(d)
}

export function formatRelativeDate(date: Date | string | null): string {
  if (!date) return "Never";
  let d: Date;
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split("-").map(Number);
    d = new Date(year, month - 1, day);
  } else {
    d = new Date(date);
  }
  const now = new Date();

  // Normalize both dates to remove time part
  const normalize = (dt: Date) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  const dNorm = normalize(d);
  const nowNorm = normalize(now);

  const diffDays = Math.floor((nowNorm.getTime() - dNorm.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      timeZone: "America/Los_Angeles",
    }).format(d);
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Los_Angeles",
  }).format(d);
}

// Format number with commas
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

// Get location from IP address (simplified version)
export async function getLocationFromIP(ip: string): Promise<string | null> {
  try {
    // In a real application, you would use a geolocation API service
    // For example: ipinfo.io, ipapi.co, or ipstack
    // This is a simplified version for demonstration
      const response = await fetch(`http://ip-api.com/json/${ip}`)
      const data = await response.json()
      const city = data.city;
      const country = data.country_name;

      if (city && country) {
        return `${city}, ${country}`;
      } else if (country) {
        return country;
      } else if (city) {
        return city;
      } else {
        return "Unknown";
      }
  } catch (error) {
    console.error("Error getting location from IP:", error)
    return null
  }
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

// Validate URL
export function isValidURL(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
// Validate email
export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

// Validate phone number
export function isValidPhone(phone: string): boolean {
  const re = Phone(phone)
  return re.isValid
}

export function serialize(data: QRData): string {
  switch (data.type) {
    case "url":   return data.url;
    case "text":  return data.text;
    case "email": return `mailto:${data.to}?subject=${encodeURIComponent(data.subject)}&body=${encodeURIComponent(data.body)}`;
    case "phone": return `tel:${data.number}`;
    case "sms":   return `sms:${data.number}?body=${encodeURIComponent(data.message)}`;
    case "wifi":  return `WIFI:S:${data.ssid};T:${data.authenticationType};P:${data.password};;`;
    case "file":  return data.key; // or a public URL if you have one
  }
}

export function getContrastColor(color: string): "black" | "white" {
  let r: number, g: number, b: number;

  // Handle hex format (#rgb, #rrggbb)
  if (color.startsWith("#")) {
    let hex = color;
    if (hex.length === 4) {
      hex = "#" + [...hex.slice(1)].map(char => char + char).join("");
    }
    r = parseInt(hex.substr(1, 2), 16);
    g = parseInt(hex.substr(3, 2), 16);
    b = parseInt(hex.substr(5, 2), 16);
  }
  // Handle rgb() or rgba() format
  else if (color.startsWith("rgb")) {
    const nums = color.match(/\d+/g);
    if (nums && nums.length >= 3) {
      [r, g, b] = nums.slice(0, 3).map(n => parseInt(n, 10));
    } else {
      // Fallback to black if parsing fails
      return "black";
    }
  }
  // Unknown format, fallback to black
  else {
    return "black";
  }

  // Calculate luminance and return contrast color
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 186 ? "black" : "white";
}

// Parsed result of a CSS color or gradient string
export interface ParsedColorValue {
  colorType: "solid" | "gradient";
  colors: string[];
  gradientType: "linear" | "radial";
  rotation: number;
}

/**
 * Parse a CSS color or gradient string into its components.
 * Supports hex, rgb/rgba, linear-gradient, and radial-gradient.
 */
export function parseColorValue(
  val: string,
  current: {
    gradientType?: "linear" | "radial";
    rotation?: number;
    colors?: string[];
  } = {}
): ParsedColorValue {
  const gradientType = current.gradientType ?? "linear";
  let rotation = current.rotation ?? 0;

  // Solid hex
  if (val.startsWith("#")) {
    return { colorType: "solid", colors: [val], gradientType, rotation };
  }
  // Solid rgb() or rgba()
  if (val.toLowerCase().startsWith("rgb")) {
    return { colorType: "solid", colors: [val], gradientType, rotation };
  }
  // linear-gradient(...)
  if (val.startsWith("linear-gradient")) {
    const angleMatch = val.match(/^linear-gradient\((\d+)deg/);
    rotation = angleMatch ? parseInt(angleMatch[1], 10) : rotation;
    const matches = val.match(/rgba?\([^)]+\)|#[0-9A-Fa-f]{3,6}/gi) || [];
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
  // radial-gradient(...)
  if (val.startsWith("radial-gradient")) {
    const matches = val.match(/rgba?\([^)]+\)|#[0-9A-Fa-f]{3,6}/gi) || [];
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
  // Fallback to solid with raw value
  return { colorType: "solid", colors: [val], gradientType, rotation };
}

export function averageColors(colors: string[]): string {
  function parseColor(color: string): { r: number; g: number; b: number; a: number } {
    color = color.trim().toLowerCase();

    // Hex formats: #RGB, #RGBA, #RRGGBB, #RRGGBBAA
    if (color.startsWith("#")) {
      let r = 0, g = 0, b = 0, a = 1;
      if (color.length === 4) {
        r = parseInt(color[1] + color[1], 16);
        g = parseInt(color[2] + color[2], 16);
        b = parseInt(color[3] + color[3], 16);
      } else if (color.length === 5) {
        r = parseInt(color[1] + color[1], 16);
        g = parseInt(color[2] + color[2], 16);
        b = parseInt(color[3] + color[3], 16);
        a = parseInt(color[4] + color[4], 16) / 255;
      } else if (color.length === 7) {
        r = parseInt(color.substr(1, 2), 16);
        g = parseInt(color.substr(3, 2), 16);
        b = parseInt(color.substr(5, 2), 16);
      } else if (color.length === 9) {
        r = parseInt(color.substr(1, 2), 16);
        g = parseInt(color.substr(3, 2), 16);
        b = parseInt(color.substr(5, 2), 16);
        a = parseInt(color.substr(7, 2), 16) / 255;
      }
      return { r, g, b, a };
    }

    // rgb() or rgba()
    const rgbaMatch = color.match(/^rgba?\(([^)]+)\)$/);
    if (rgbaMatch) {
      const parts = rgbaMatch[1].split(",").map(p => p.trim());
      const r = parseInt(parts[0], 10);
      const g = parseInt(parts[1], 10);
      const b = parseInt(parts[2], 10);
      let a = 1;
      if (parts.length === 4) {
        a = parseFloat(parts[3]);
      }
      return { r, g, b, a };
    }

    // Fallback to black opaque
    return { r: 0, g: 0, b: 0, a: 1 };
  }

  // If only one color, just return its composite over white
  if (colors.length === 1) {
    const { r, g, b, a } = parseColor(colors[0]);
    const rComp = Math.round(r * a + 255 * (1 - a));
    const gComp = Math.round(g * a + 255 * (1 - a));
    const bComp = Math.round(b * a + 255 * (1 - a));
    return `rgb(${rComp}, ${gComp}, ${bComp})`;
  }

  let rSum = 0, gSum = 0, bSum = 0;

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
  const rAvg = Math.round(rSum / len);
  const gAvg = Math.round(gSum / len);
  const bAvg = Math.round(bSum / len);

  return `rgb(${rAvg}, ${gAvg}, ${bAvg})`;
}

// Contrast ratio utilities
export function parseColorToRgb(color: string): { r: number; g: number; b: number } {
  // Handle hex format
  if (color.startsWith("#")) {
    const hex = color.replace(/^#/, "");
    const match = hex.match(/.{1,2}/g);
    if (match && match.length >= 3) {
      const [r, g, b] = match;
      return { r: parseInt(r, 16), g: parseInt(g, 16), b: parseInt(b, 16) };
    }
  }
  // Handle rgb or rgba format, capturing optional alpha
  const rgbMatch = color.match(
    /rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:\s*,\s*([0-9.]+))?\s*\)/
  );
  if (rgbMatch) {
    const [, rStr, gStr, bStr, aStr] = rgbMatch;
    const r = parseInt(rStr, 10);
    const g = parseInt(gStr, 10);
    const b = parseInt(bStr, 10);
    const a = aStr !== undefined ? parseFloat(aStr) : 1;
    // Composite over white background
    const rComp = Math.round(r * a + 255 * (1 - a));
    const gComp = Math.round(g * a + 255 * (1 - a));
    const bComp = Math.round(b * a + 255 * (1 - a));
    return { r: rComp, g: gComp, b: bComp };
  }
  // Fallback to white
  return { r: 255, g: 255, b: 255 };
}

export function luminanceComponent(channel: number) {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function getLuminance(hex: string) {
  const { r, g, b } = parseColorToRgb(hex);
  return (
    0.2126 * luminanceComponent(r) +
    0.7152 * luminanceComponent(g) +
    0.0722 * luminanceComponent(b)
  );
}

export function contrastRatio(hex1: string, hex2: string) {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const bright = Math.max(lum1, lum2);
  const dark = Math.min(lum1, lum2);
  return (bright + 0.05) / (dark + 0.05);
}

export function isApexDomain(domain: string): boolean {
  return domain.split('.').length <= 2;
}

export function isSubdomain(domain: string): boolean {
  return !isApexDomain(domain);
}
