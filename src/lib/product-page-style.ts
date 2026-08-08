import type { BrandProfile, ProductPageStyle } from "@/lib/types";

export const DEFAULT_PRODUCT_PAGE_STYLE = {
  brandName: "My brand",
  logoUrl: null,
  websiteUrl: null,
  primaryColor: "#111827",
  accentColor: "#0f766e",
  backgroundColor: "#ffffff",
  cardColor: "#ffffff",
  textColor: "#172033",
} as const;

export type ResolvedProductPageStyle = {
  brandName: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  cardColor: string;
  textColor: string;
};

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

function safeColor(value: string | null | undefined, fallback: string): string {
  return value && HEX_COLOR.test(value.trim()) ? value.trim() : fallback;
}

function safeText(value: string | null | undefined, fallback: string): string {
  return value?.trim() || fallback;
}

function safeAsset(value: string | null | undefined): string | null {
  if (!value?.trim()) {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.startsWith("/product-images/")) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const isLocalHost = ["localhost", "127.0.0.1"].includes(url.hostname);
    return url.protocol === "https:" || (url.protocol === "http:" && isLocalHost) ? url.toString() : null;
  } catch {
    return null;
  }
}

function safeWebsite(value: string | null | undefined): string | null {
  if (!value?.trim()) {
    return null;
  }

  try {
    const url = new URL(value.trim());
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

export function resolveProductPageStyle(
  overrides: ProductPageStyle | null | undefined,
  brand: BrandProfile,
): ResolvedProductPageStyle {
  return {
    brandName: safeText(overrides?.brandName ?? brand.brandName, DEFAULT_PRODUCT_PAGE_STYLE.brandName),
    logoUrl: safeAsset(overrides?.logoUrl ?? brand.logoUrl ?? DEFAULT_PRODUCT_PAGE_STYLE.logoUrl),
    websiteUrl: safeWebsite(overrides?.websiteUrl ?? brand.websiteUrl ?? DEFAULT_PRODUCT_PAGE_STYLE.websiteUrl),
    primaryColor: safeColor(overrides?.primaryColor ?? brand.primaryColor, DEFAULT_PRODUCT_PAGE_STYLE.primaryColor),
    accentColor: safeColor(overrides?.accentColor ?? brand.accentColor, DEFAULT_PRODUCT_PAGE_STYLE.accentColor),
    backgroundColor: safeColor(overrides?.backgroundColor ?? brand.backgroundColor, DEFAULT_PRODUCT_PAGE_STYLE.backgroundColor),
    cardColor: safeColor(overrides?.cardColor ?? brand.cardColor, DEFAULT_PRODUCT_PAGE_STYLE.cardColor),
    textColor: safeColor(overrides?.textColor ?? brand.textColor, DEFAULT_PRODUCT_PAGE_STYLE.textColor),
  };
}

function rgb(color: string): [number, number, number] {
  const value = color.slice(1);
  return [0, 2, 4].map((index) => Number.parseInt(value.slice(index, index + 2), 16)) as [number, number, number];
}

function luminance(color: string): number {
  return rgb(color)
    .map((channel) => channel / 255)
    .map((channel) => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
    .reduce((total, channel, index) => total + channel * [0.2126, 0.7152, 0.0722][index], 0);
}

export function contrastRatio(first: string, second: string): number {
  const light = Math.max(luminance(first), luminance(second));
  const dark = Math.min(luminance(first), luminance(second));
  return (light + 0.05) / (dark + 0.05);
}

export function getProductPageStyleContrastIssues(style: ResolvedProductPageStyle): string[] {
  const issues: string[] = [];
  if (contrastRatio(style.textColor, style.cardColor) < 4.5) {
    issues.push("Text and card colors do not meet readable contrast");
  }
  if (contrastRatio(style.textColor, style.backgroundColor) < 4.5) {
    issues.push("Text and page background colors do not meet readable contrast");
  }
  if (contrastRatio(style.primaryColor, style.cardColor) < 3) {
    issues.push("Primary color is too close to the card color");
  }
  if (contrastRatio(style.accentColor, style.cardColor) < 2.2) {
    issues.push("Accent color is too close to the card color");
  }
  return issues;
}

function readableColor(background: string, preferred: string, minimum: number, fallback: string): string {
  if (contrastRatio(preferred, background) >= minimum) {
    return preferred;
  }

  return [fallback, "#111827", "#000000", "#ffffff"]
    .sort((first, second) => contrastRatio(second, background) - contrastRatio(first, background))
    .find((candidate) => contrastRatio(candidate, background) >= minimum)
    ?? fallback;
}

export function ensureReadableProductPageStyle(style: ResolvedProductPageStyle): ResolvedProductPageStyle {
  const cardTextColor = readableColor(style.cardColor, style.textColor, 4.5, DEFAULT_PRODUCT_PAGE_STYLE.textColor);
  const textColor = contrastRatio(cardTextColor, style.backgroundColor) >= 4.5
    ? cardTextColor
    : readableColor(style.backgroundColor, cardTextColor, 4.5, DEFAULT_PRODUCT_PAGE_STYLE.textColor);
  const primaryColor = readableColor(style.cardColor, style.primaryColor, 3, textColor);
  const accentColor = readableColor(style.cardColor, style.accentColor, 2.2, primaryColor);

  return { ...style, textColor, primaryColor, accentColor };
}
