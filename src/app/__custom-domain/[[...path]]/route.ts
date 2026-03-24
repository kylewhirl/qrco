import { type NextRequest, NextResponse } from "next/server";
import { getCustomDomainFallbackUrlForHostname } from "@/lib/custom-domains";
import { buildQrResponse } from "@/lib/qr-response";
import { getQRByHostAndCode } from "@/lib/qr-service";
import { getRequestHostname } from "@/lib/qr-url";

async function handleCustomDomainRequest(
  request: NextRequest,
  params: Promise<{ path?: string[] }>,
) {
  const { path } = await params;
  const code = path?.join("/") ?? "";
  const hostname = getRequestHostname(request);
  const fallbackUrl = await getCustomDomainFallbackUrlForHostname(hostname);

  if (!code) {
    return NextResponse.redirect(fallbackUrl);
  }

  const qr = await getQRByHostAndCode(hostname, code);
  if (!qr) {
    return NextResponse.redirect(fallbackUrl);
  }

  const response = await buildQrResponse(request, qr);
  return response.status === 404 ? NextResponse.redirect(fallbackUrl) : response;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  return handleCustomDomainRequest(request, params);
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  return handleCustomDomainRequest(request, params);
}
