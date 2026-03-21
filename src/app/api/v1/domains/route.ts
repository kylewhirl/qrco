import { NextRequest, NextResponse } from "next/server";
import { authorizeApiRequest, buildApiPreflightResponse } from "@/lib/api-request-auth";
import { listCustomDomainsForUser } from "@/lib/custom-domains";

export async function GET(request: NextRequest) {
  const authorization = await authorizeApiRequest(request, ["qr:read"]);
  if (!authorization.ok) {
    return authorization.response;
  }

  try {
    const domains = await listCustomDomainsForUser(authorization.value.auth.userId);
    return NextResponse.json({
      data: domains.map((domain) => ({
        id: domain.id,
        hostname: domain.hostname,
        status: domain.status,
        isPrimary: domain.isPrimary,
      })),
    }, {
      headers: authorization.value.corsHeaders,
    });
  } catch (error) {
    console.error("Failed to list domains:", error);
    return NextResponse.json({ error: "Failed to list domains" }, {
      status: 500,
      headers: authorization.value.corsHeaders,
    });
  }
}

export async function OPTIONS(request: NextRequest) {
  return buildApiPreflightResponse(request);
}
