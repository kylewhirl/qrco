import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack";
import { deleteStylePresetForUser, getStylePresetForUser, updateStylePresetForUser } from "@/lib/brand-styles";
import { stylePresetUpdateSchema } from "@/lib/qr-validation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await stackServerApp.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const preset = await getStylePresetForUser(user.id, id);
    if (!preset) {
      return NextResponse.json({ error: "Style preset not found" }, { status: 404 });
    }

    return NextResponse.json({ preset });
  } catch (error) {
    console.error("Failed to load style preset:", error);
    return NextResponse.json({ error: "Failed to load style preset" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await stackServerApp.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const parsed = stylePresetUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { id } = await params;
    const preset = await updateStylePresetForUser(user.id, id, parsed.data);
    if (!preset) {
      return NextResponse.json({ error: "Style preset not found" }, { status: 404 });
    }

    return NextResponse.json({ preset });
  } catch (error) {
    console.error("Failed to update style preset:", error);
    return NextResponse.json({ error: "Failed to update style preset" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await stackServerApp.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const deleted = await deleteStylePresetForUser(user.id, id);
    if (!deleted) {
      return NextResponse.json({ error: "Style preset not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete style preset:", error);
    return NextResponse.json({ error: "Failed to delete style preset" }, { status: 500 });
  }
}
