const DEFAULT_QR_HOST = process.env.NEXT_PUBLIC_DEFAULT_QR_HOST || "tqrco.de";

export function normalizeHostname(hostname: string | null | undefined): string {
  if (!hostname) {
    return "";
  }

  const trimmed = hostname.trim().toLowerCase();
  const withoutProtocol = trimmed.replace(/^https?:\/\//, "");
  const withoutPath = withoutProtocol.split("/")[0] || "";
  return withoutPath.replace(/\.$/, "").split(":")[0] || "";
}

export function getApexName(hostname: string): string {
  const labels = normalizeHostname(hostname).split(".").filter(Boolean);
  if (labels.length <= 2) {
    return labels.join(".");
  }

  return labels.slice(-2).join(".");
}

export function isValidHostname(hostname: string): boolean {
  const normalized = normalizeHostname(hostname);
  if (!normalized || normalized.length > 253 || !normalized.includes(".")) {
    return false;
  }

  return normalized
    .split(".")
    .every((label) => /^[a-z0-9-]{1,63}$/.test(label) && !label.startsWith("-") && !label.endsWith("-"));
}

export function getPrimaryAppHosts(): string[] {
  return Array.from(
    new Set(
      (process.env.PRIMARY_APP_HOSTS || "")
        .split(",")
        .map((value) => normalizeHostname(value))
        .filter(Boolean)
        .concat([DEFAULT_QR_HOST, "www.tqrco.de", "localhost", "127.0.0.1"]),
    ),
  );
}

export function isPrimaryAppHost(hostname: string): boolean {
  const normalized = normalizeHostname(hostname);
  if (!normalized) {
    return false;
  }

  if (normalized.endsWith(".vercel.app")) {
    return true;
  }

  return getPrimaryAppHosts().includes(normalized);
}

export function buildPublicQrUrl(code: string, customHostname?: string | null): string {
  const hostname = normalizeHostname(customHostname) || DEFAULT_QR_HOST;
  return `https://${hostname}/${code}`;
}
