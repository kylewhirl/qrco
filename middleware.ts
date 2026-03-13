import { NextResponse, type NextRequest } from "next/server";
import { isPrimaryAppHost, normalizeHostname } from "@/lib/qr-url";

export function middleware(request: NextRequest) {
  const hostname = normalizeHostname(request.headers.get("host"));

  if (!hostname || isPrimaryAppHost(hostname)) {
    return NextResponse.next();
  }

  if (!["GET", "HEAD"].includes(request.method)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const pathname = request.nextUrl.pathname;
  if (pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 1) {
    return NextResponse.next();
  }

  return new NextResponse("Not Found", { status: 404 });
}

export const config = {
  matcher: "/:path*",
};
