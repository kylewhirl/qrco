import { NextRequest, NextResponse } from "next/server";
import { authorizeApiRequest, buildApiPreflightResponse } from "@/lib/api-request-auth";
import { getBrandProfileForUser, upsertBrandProfileForUser } from "@/lib/brand-styles";
import { brandProfileSchema } from "@/lib/qr-validation";

export async function GET(request: NextRequest) {
  const authorization = await authorizeApiRequest(request, ["brand:read"]);
  if (!authorization.ok) {
    return authorization.response;
  }

  try {
    const brand = await getBrandProfileForUser(authorization.value.auth.userId);
    return NextResponse.json({ data: brand }, { headers: authorization.value.corsHeaders });
  } catch (error) {
    console.error("Failed to fetch brand profile:", error);
    return NextResponse.json({ error: "Failed to fetch brand profile" }, {
      status: 500,
      headers: authorization.value.corsHeaders,
    });
  }
}

export async function PUT(request: NextRequest) {
  const authorization = await authorizeApiRequest(request, ["brand:write"]);
  if (!authorization.ok) {
    return authorization.response;
  }

  try {
    const parsed = brandProfileSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid brand payload" }, {
        status: 400,
        headers: authorization.value.corsHeaders,
      });
    }

    const brand = await upsertBrandProfileForUser(authorization.value.auth.userId, {
      ...parsed.data,
      logoUrl: parsed.data.logoUrl ?? null,
    });
    return NextResponse.json({ data: brand }, { headers: authorization.value.corsHeaders });
  } catch (error) {
    console.error("Failed to update brand profile:", error);
    return NextResponse.json({ error: "Failed to update brand profile" }, {
      status: 500,
      headers: authorization.value.corsHeaders,
    });
  }
}

export async function OPTIONS(request: NextRequest) {
  return buildApiPreflightResponse(request);
}
