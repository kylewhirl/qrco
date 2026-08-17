import { type NextRequest, NextResponse } from "next/server";
import { getCustomDomainFallbackUrlForHostname } from "@/lib/custom-domains";
import { buildQrResponse } from "@/lib/qr-response";
import { getQRByHostAndCode } from "@/lib/qr-service";
import { getRequestHostname, isPrimaryAppHost } from "@/lib/qr-url";

async function handleCustomDomainRequest(
  request: NextRequest,
  params: Promise<{ path?: string[] }>,
) {
  const hostname = getRequestHostname(request);
  if (
    request.headers.get("x-qrco-custom-domain") !== "1"
    || !hostname
    || isPrimaryAppHost(hostname)
  ) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const { path } = await params;
  const code = path?.join("/") ?? "";

  if (!code) {
    return NextResponse.redirect(await getCustomDomainFallbackUrlForHostname(hostname));
  }

  const qr = await getQRByHostAndCode(hostname, code);
  if (!qr) {
    return NextResponse.redirect(await getCustomDomainFallbackUrlForHostname(hostname));
  }

  const response = await buildQrResponse(request, qr);
  return response.status === 404
    ? NextResponse.redirect(await getCustomDomainFallbackUrlForHostname(hostname))
    : response;
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
