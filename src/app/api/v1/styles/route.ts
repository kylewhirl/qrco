import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKeyRequest } from "@/lib/api-request-auth";
import { createStylePresetForUser, listStylePresetsForUser } from "@/lib/brand-styles";
import { stylePresetCreateSchema } from "@/lib/qr-validation";

export async function GET(request: NextRequest) {
  const auth = await authenticateApiKeyRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const presets = await listStylePresetsForUser(auth.userId);
    return NextResponse.json({ data: presets });
  } catch (error) {
    console.error("Failed to list style presets:", error);
    return NextResponse.json({ error: "Failed to list style presets" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticateApiKeyRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const parsed = stylePresetCreateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid style preset payload" }, { status: 400 });
    }

    const preset = await createStylePresetForUser(auth.userId, {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      isDefault: parsed.data.isDefault ?? false,
      config: parsed.data.config,
    });

    return NextResponse.json({ data: preset }, { status: 201 });
  } catch (error) {
    console.error("Failed to create style preset:", error);
    return NextResponse.json({ error: "Failed to create style preset" }, { status: 500 });
  }
}
