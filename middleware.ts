import { NextResponse, type NextRequest } from "next/server";
import { getRequestHostname, isPrimaryAppHost } from "@/lib/qr-url";

export function middleware(request: NextRequest) {
  const hostname = getRequestHostname(request);

  if (!hostname || isPrimaryAppHost(hostname)) {
    return NextResponse.next();
  }

  if (!["GET", "HEAD"].includes(request.method)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = `/__custom-domain${request.nextUrl.pathname === "/" ? "" : request.nextUrl.pathname}`;
  return NextResponse.rewrite(rewriteUrl);
}

export const config = {
  matcher: "/:path*",
};
