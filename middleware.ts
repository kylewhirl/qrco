import { NextResponse, type NextRequest } from "next/server";
import { getRequestHostname, isPrimaryAppHost } from "@/lib/qr-url";

export function middleware(request: NextRequest) {
  const hostname = getRequestHostname(request);

  if (!hostname || isPrimaryAppHost(hostname)) {
    return NextResponse.next();
  }

  if (request.headers.get("x-qrco-custom-domain") === "1") {
    return NextResponse.next();
  }

  if (!["GET", "HEAD"].includes(request.method)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const hostedProductMatch = /^\/product\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\/?$/i.exec(request.nextUrl.pathname);
  if (hostedProductMatch) {
    if (request.headers.get("x-qrco-hosted-product") === "1") {
      return NextResponse.next();
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-qrco-hosted-product", "1");
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = `/product/${hostedProductMatch[1]}`;
    return NextResponse.rewrite(rewriteUrl, { request: { headers: requestHeaders } });
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-qrco-custom-domain", "1");
  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = `/api/internal/custom-domain${request.nextUrl.pathname === "/" ? "" : request.nextUrl.pathname}`;
  return NextResponse.rewrite(rewriteUrl, { request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/", "/:path*"],
};
