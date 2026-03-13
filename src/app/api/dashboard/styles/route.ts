import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import { createStylePresetForUser, listStylePresetsForUser } from "@/lib/brand-styles";
import { stylePresetCreateSchema } from "@/lib/qr-validation";

export async function GET() {
  const user = await stackServerApp.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const presets = await listStylePresetsForUser(user.id);
    return NextResponse.json({ presets });
  } catch (error) {
    console.error("Failed to load style presets:", error);
    return NextResponse.json({ error: "Failed to load style presets" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await stackServerApp.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const parsed = stylePresetCreateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const preset = await createStylePresetForUser(user.id, {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      isDefault: parsed.data.isDefault ?? false,
      config: parsed.data.config,
    });

    return NextResponse.json({ preset }, { status: 201 });
  } catch (error) {
    console.error("Failed to create style preset:", error);
    return NextResponse.json({ error: "Failed to create style preset" }, { status: 500 });
  }
}
