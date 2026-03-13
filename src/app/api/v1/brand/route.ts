import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKeyRequest } from "@/lib/api-request-auth";
import { getBrandProfileForUser, upsertBrandProfileForUser } from "@/lib/brand-styles";
import { brandProfileSchema } from "@/lib/qr-validation";

export async function GET(request: NextRequest) {
  const auth = await authenticateApiKeyRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const brand = await getBrandProfileForUser(auth.userId);
    return NextResponse.json({ data: brand });
  } catch (error) {
    console.error("Failed to fetch brand profile:", error);
    return NextResponse.json({ error: "Failed to fetch brand profile" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await authenticateApiKeyRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const parsed = brandProfileSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid brand payload" }, { status: 400 });
    }

    const brand = await upsertBrandProfileForUser(auth.userId, {
      ...parsed.data,
      logoUrl: parsed.data.logoUrl ?? null,
    });
    return NextResponse.json({ data: brand });
  } catch (error) {
    console.error("Failed to update brand profile:", error);
    return NextResponse.json({ error: "Failed to update brand profile" }, { status: 500 });
  }
}
