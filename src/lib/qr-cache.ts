import "server-only";

import { createHash } from "node:crypto";
import { revalidateTag } from "next/cache";

function hashCacheIdentity(parts: string[]): string {
  return createHash("sha256").update(parts.join("\0")).digest("hex");
}

export function qrLookupCacheTag(hostname: string, code: string): string {
  return `qr-lookup:${hashCacheIdentity([hostname, code])}`;
}

export function qrDomainCacheTag(hostname: string): string {
  return `qr-domain:${hashCacheIdentity([hostname])}`;
}

export function invalidateQrLookup(hostname: string, code: string): void {
  revalidateTag(qrLookupCacheTag(hostname, code), { expire: 0 });
}

export function invalidateQrDomain(hostname: string): void {
  revalidateTag(qrDomainCacheTag(hostname), { expire: 0 });
}
