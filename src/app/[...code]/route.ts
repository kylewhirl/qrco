import { type NextRequest, NextResponse } from "next/server";
import { getCustomDomainFallbackUrlForHostname } from "@/lib/custom-domains";
import { buildQrResponse } from "@/lib/qr-response";
import { getQRByHostAndCode } from "@/lib/qr-service";
import { getRequestHostname, isPrimaryAppHost } from "@/lib/qr-url";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string[] }> },
) {
  const { code: segments } = await params;
  const code = segments.join("/");
  const hostname = getRequestHostname(request);

  const qr = await getQRByHostAndCode(hostname, code);

  if (!qr) {
    if (!isPrimaryAppHost(hostname)) {
      return NextResponse.redirect(await getCustomDomainFallbackUrlForHostname(hostname));
    }

    return NextResponse.redirect(new URL("/not-found", request.url));
  }

  const response = await buildQrResponse(request, qr);
  if (response.status === 404) {
    if (!isPrimaryAppHost(hostname)) {
      return NextResponse.redirect(await getCustomDomainFallbackUrlForHostname(hostname));
    }

    return NextResponse.redirect(new URL("/not-found", request.url));
  }

  return response;
}
