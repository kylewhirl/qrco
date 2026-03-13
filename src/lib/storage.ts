import "server-only";

import { randomUUID } from "node:crypto";
import { getPrimaryAppHosts, normalizeHostname } from "@/lib/qr-url";

const STORAGE_SEGMENT_PATTERN = /[^a-zA-Z0-9_-]/g;
const FILE_EXTENSION_PATTERN = /^[a-z0-9]{1,16}$/i;
const DEFAULT_UPLOAD_EXTENSION = "bin";

export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

function sanitizeStorageSegment(value: string): string {
  return value.replace(STORAGE_SEGMENT_PATTERN, "-");
}

export function sanitizeFileExtension(filename: string): string {
  const extension = filename.split(".").pop()?.trim().toLowerCase() ?? "";
  if (!extension || !FILE_EXTENSION_PATTERN.test(extension)) {
    return DEFAULT_UPLOAD_EXTENSION;
  }

  return extension;
}

export function buildUploadObjectKey(userId: string, qrId: string, filename: string): string {
  const extension = sanitizeFileExtension(filename);
  return `uploads/${sanitizeStorageSegment(userId)}/${sanitizeStorageSegment(qrId)}/${randomUUID()}.${extension}`;
}

export function buildSignedUrl(key: string): string {
  const accountId = process.env.R2_ACCOUNT_ID!;
  const bucketName = process.env.R2_BUCKET_NAME!;
  return `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${encodeURIComponent(key)}`;
}

function getAllowedServerLogoHosts() {
  return new Set(
    [
      ...getPrimaryAppHosts(),
      ...(process.env.QR_LOGO_ALLOWED_HOSTS || "")
        .split(",")
        .map((value) => normalizeHostname(value))
        .filter(Boolean),
    ],
  );
}

export function resolveSafeServerLogoSrc(src: string | null | undefined): string | undefined {
  if (!src) {
    return undefined;
  }

  const trimmed = src.trim();
  if (!trimmed) {
    return undefined;
  }

  if (trimmed.startsWith("data:image/")) {
    return trimmed;
  }

  if (trimmed.startsWith("/")) {
    const [primaryHost] = getPrimaryAppHosts();
    return primaryHost ? `https://${primaryHost}${trimmed}` : undefined;
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return undefined;
  }

  const hostname = normalizeHostname(url.hostname);
  const allowedHosts = getAllowedServerLogoHosts();
  const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1";

  if (!allowedHosts.has(hostname)) {
    return undefined;
  }

  if (url.protocol !== "https:" && !(isLocalHost && url.protocol === "http:")) {
    return undefined;
  }

  return url.toString();
}
