import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import { getBrandProfileForUser, upsertBrandProfileForUser } from "@/lib/brand-styles";
import { brandProfileSchema } from "@/lib/qr-validation";

export async function GET() {
  const user = await stackServerApp.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const brand = await getBrandProfileForUser(user.id);
    return NextResponse.json({ brand });
  } catch (error) {
    console.error("Failed to load brand profile:", error);
    return NextResponse.json({ error: "Failed to load brand profile" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const user = await stackServerApp.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const parsed = brandProfileSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const brand = await upsertBrandProfileForUser(user.id, {
      ...parsed.data,
      logoUrl: parsed.data.logoUrl ?? null,
    });
    return NextResponse.json({ brand });
  } catch (error) {
    console.error("Failed to save brand profile:", error);
    return NextResponse.json({ error: "Failed to save brand profile" }, { status: 500 });
  }
}
