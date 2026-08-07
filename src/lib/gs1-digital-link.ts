import type { QRData } from "@/lib/types";
import { buildPublicQrUrl } from "@/lib/qr-url";

export type Gs1DigitalLinkAttributes = NonNullable<QRData["gs1"]>;

const GS1_GTIN_LENGTHS = new Set([8, 12, 13, 14]);

export function normalizeGtin(value: string): string {
  // Spaces and hyphens are common presentation formatting. Preserve every
  // other character so invalid customer input is never silently corrected.
  return value.trim().replace(/[\s-]/g, "");
}

export function hasValidGtinCheckDigit(value: string): boolean {
  const gtin = normalizeGtin(value);
  if (!/^\d+$/.test(gtin) || !GS1_GTIN_LENGTHS.has(gtin.length)) {
    return false;
  }

  const digits = [...gtin].map(Number);
  const checkDigit = digits.pop();
  if (checkDigit === undefined) {
    return false;
  }

  const sum = digits
    .reverse()
    .reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 3 : 1), 0);

  return (10 - (sum % 10)) % 10 === checkDigit;
}

export type GtinValidationResult = {
  valid: boolean;
  submitted: string;
  normalized: string;
  gtin14: string | null;
  format: "GTIN-8" | "GTIN-12 / UPC-A" | "GTIN-13 / EAN-13" | "GTIN-14" | null;
  reason?: string;
};

export function validateGtin(value: string): GtinValidationResult {
  const submitted = value;
  const normalized = normalizeGtin(value);
  const format = normalized.length === 8
    ? "GTIN-8"
    : normalized.length === 12
      ? "GTIN-12 / UPC-A"
      : normalized.length === 13
        ? "GTIN-13 / EAN-13"
        : normalized.length === 14
          ? "GTIN-14"
          : null;

  if (!/^\d+$/.test(normalized)) {
    return { valid: false, submitted, normalized, gtin14: null, format: null, reason: "Use digits, spaces, or hyphens only" };
  }

  if (!format) {
    return { valid: false, submitted, normalized, gtin14: null, format: null, reason: "GTIN must contain 8, 12, 13, or 14 digits" };
  }

  if (!hasValidGtinCheckDigit(normalized)) {
    return { valid: false, submitted, normalized, gtin14: null, format, reason: "Check digit is invalid" };
  }

  return { valid: true, submitted, normalized, gtin14: normalized.padStart(14, "0"), format };
}

export function toGs1ExpiryValue(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  return `${match[1].slice(2)}${match[2]}${match[3]}`;
}

export function buildGs1DigitalLinkPath(attributes: Gs1DigitalLinkAttributes): string {
  const segments = ["01", normalizeGtin(attributes.gtin).padStart(14, "0")];

  if (attributes.batchLot) {
    segments.push("10", attributes.batchLot.trim());
  }

  if (attributes.serial) {
    segments.push("21", attributes.serial.trim());
  }

  return segments.join("/");
}

export function buildGs1DigitalLinkUrl(
  attributes: Gs1DigitalLinkAttributes,
  customHostname?: string | null,
): string {
  const url = new URL(buildPublicQrUrl(buildGs1DigitalLinkPath(attributes), customHostname));
  const expiry = toGs1ExpiryValue(attributes.expiry);

  if (expiry) {
    url.searchParams.set("17", expiry);
  }

  return url.toString();
}

export function getGs1DigitalLinkUrlForQr(
  data: QRData,
  customHostname?: string | null,
): string | null {
  return data.gs1 ? buildGs1DigitalLinkUrl(data.gs1, customHostname) : null;
}
