import "server-only";

import { createSign } from "node:crypto";
import { promises as dns } from "node:dns";
import { readFileSync } from "node:fs";
import type { CustomDomain, DomainConnectState } from "@/lib/types";
import { getApexName, normalizeHostname } from "@/lib/qr-url";

function isCloudflareNameserver(value: string) {
  const normalized = value.toLowerCase().replace(/\.$/, "");
  return normalized.endsWith(".ns.cloudflare.com");
}

async function detectProvider(hostname: string): Promise<DomainConnectState["provider"]> {
  try {
    const nameservers = await dns.resolveNs(getApexName(hostname));
    if (nameservers.some(isCloudflareNameserver)) {
      return "cloudflare";
    }
  } catch (error) {
    console.error(`Failed to resolve nameservers for ${hostname}:`, error);
  }

  return null;
}

function getRelativeHost(hostname: string, apexName: string) {
  const normalizedHost = normalizeHostname(hostname);
  const normalizedApex = normalizeHostname(apexName);
  if (normalizedHost === normalizedApex) {
    return "@";
  }

  return normalizedHost.endsWith(`.${normalizedApex}`)
    ? normalizedHost.slice(0, -1 * (`.${normalizedApex}`.length))
    : normalizedHost;
}

function getCloudflareDomainConnectConfig() {
  const privateKeyFile = process.env.DOMAIN_CONNECT_CLOUDFLARE_SYNC_PRIVATE_KEY_FILE;
  const inlinePrivateKey = process.env.DOMAIN_CONNECT_CLOUDFLARE_SYNC_PRIVATE_KEY;

  return {
    providerId: process.env.DOMAIN_CONNECT_CLOUDFLARE_PROVIDER_ID,
    syncUxUrl: process.env.DOMAIN_CONNECT_CLOUDFLARE_SYNC_UX_URL,
    syncKeyHost: process.env.DOMAIN_CONNECT_CLOUDFLARE_SYNC_PUBKEY_HOST,
    syncPrivateKey: privateKeyFile ? readFileSync(privateKeyFile, "utf8") : inlinePrivateKey,
    serviceIdA: process.env.DOMAIN_CONNECT_CLOUDFLARE_SERVICE_ID_A,
    serviceIdCNAME: process.env.DOMAIN_CONNECT_CLOUDFLARE_SERVICE_ID_CNAME,
    targetVariable: process.env.DOMAIN_CONNECT_CLOUDFLARE_TARGET_VARIABLE || "value",
    redirectBaseUrl: process.env.NEXT_PUBLIC_APP_URL,
  };
}

function buildCloudflareConnectUrl(domain: CustomDomain): { connectUrl: string | null, reason: string | null } {
  const config = getCloudflareDomainConnectConfig();
  const hasTemplateConfig = Boolean(
    config.providerId &&
    config.syncUxUrl &&
    config.syncKeyHost &&
    config.syncPrivateKey &&
    config.redirectBaseUrl,
  );

  if (!hasTemplateConfig) {
    return {
      connectUrl: null,
      reason: "Cloudflare was detected, but Domain Connect template signing is not configured yet.",
    };
  }

  const recommendedA = domain.configuration?.recommendedIPv4?.[0]?.value;
  const recommendedCNAME = domain.configuration?.recommendedCNAME?.[0]?.value;

  const recordValue = Array.isArray(recommendedA)
    ? recommendedA[0]
    : typeof recommendedA === "string"
      ? recommendedA
      : typeof recommendedCNAME === "string"
        ? recommendedCNAME
        : null;

  const serviceId = Array.isArray(recommendedA) && recommendedA.length > 0
    ? config.serviceIdA
    : recommendedCNAME
      ? config.serviceIdCNAME
      : null;

  if (!recordValue || !serviceId) {
    return {
      connectUrl: null,
      reason: "Vercel did not return a usable DNS target for Domain Connect.",
    };
  }

  const redirectUrl = new URL("/dashboard/settings", config.redirectBaseUrl);
  redirectUrl.searchParams.set("domainConnect", "done");
  redirectUrl.searchParams.set("domainId", domain.id);
  redirectUrl.hash = "domains";

  const params = new URLSearchParams();
  params.set("domain", domain.apexName);
  params.set("host", getRelativeHost(domain.hostname, domain.apexName));
  params.set(config.targetVariable, recordValue);
  params.set("redirect_uri", redirectUrl.toString());
  params.set("state", domain.id);

  const signer = createSign("RSA-SHA256");
  signer.update(params.toString());
  signer.end();

  const signature = signer.sign(config.syncPrivateKey!, "base64");
  params.set("key", config.syncKeyHost!);
  params.set("sig", signature);

  return {
    connectUrl: `${config.syncUxUrl!.replace(/\/$/, "")}/v2/domainTemplates/providers/${encodeURIComponent(config.providerId!)}/services/${encodeURIComponent(serviceId)}/apply?${params.toString()}`,
    reason: null,
  };
}

export async function getDomainConnectState(domain: CustomDomain): Promise<DomainConnectState> {
  const provider = await detectProvider(domain.hostname);
  if (!provider) {
    return {
      provider: null,
      eligible: false,
      enabled: false,
      connectUrl: null,
      reason: "Domain Connect was not detected for this DNS provider.",
    };
  }

  if (provider === "cloudflare") {
    const result = buildCloudflareConnectUrl(domain);
    return {
      provider,
      eligible: true,
      enabled: Boolean(result.connectUrl),
      connectUrl: result.connectUrl,
      reason: result.reason,
    };
  }

  return {
    provider,
    eligible: false,
    enabled: false,
    connectUrl: null,
    reason: "This DNS provider is not supported yet.",
  };
}
