const DEFAULT_QR_HOST = process.env.NEXT_PUBLIC_DEFAULT_QR_HOST || "tqrco.de";
const DEFAULT_APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://theqrcode.co";
const DEFAULT_APP_HOST = normalizeHostname(new URL(DEFAULT_APP_URL).hostname);

export function normalizeHostname(hostname: string | null | undefined): string {
  if (!hostname) {
    return "";
  }

  const trimmed = hostname.trim().toLowerCase();
  const withoutProtocol = trimmed.replace(/^https?:\/\//, "");
  const withoutPath = withoutProtocol.split("/")[0] || "";
  return withoutPath.replace(/\.$/, "").split(":")[0] || "";
}

export function getRequestHostname(
  source:
    | { headers: Pick<Headers, "get">; nextUrl?: { hostname?: string } }
    | { headers: Record<string, string | string[] | undefined>; nextUrl?: { hostname?: string } },
): string {
  const headerValue = typeof (source.headers as { get?: unknown }).get === "function"
    ? (source.headers as Pick<Headers, "get">).get("x-forwarded-host")
        || (source.headers as Pick<Headers, "get">).get("host")
    : (source.headers as Record<string, string | string[] | undefined>)["x-forwarded-host"]
        || (source.headers as Record<string, string | string[] | undefined>).host;

  const resolvedHeader = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  return normalizeHostname(resolvedHeader || source.nextUrl?.hostname || "");
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
        .concat([DEFAULT_APP_HOST, DEFAULT_QR_HOST, "www.tqrco.de", "localhost", "127.0.0.1"]),
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

export function getPrimaryAppUrl(pathname = "/"): URL {
  return new URL(pathname, DEFAULT_APP_URL);
}

export function buildPublicQrUrl(code: string, customHostname?: string | null): string {
  const hostname = normalizeHostname(customHostname) || DEFAULT_QR_HOST;
  return `https://${hostname}/${code}`;
}
