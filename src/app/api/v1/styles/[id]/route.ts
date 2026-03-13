import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKeyRequest } from "@/lib/api-request-auth";
import { deleteStylePresetForUser, getStylePresetForUser, updateStylePresetForUser } from "@/lib/brand-styles";
import { stylePresetUpdateSchema } from "@/lib/qr-validation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateApiKeyRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const preset = await getStylePresetForUser(auth.userId, id);
    if (!preset) {
      return NextResponse.json({ error: "Style preset not found" }, { status: 404 });
    }

    return NextResponse.json({ data: preset });
  } catch (error) {
    console.error("Failed to fetch style preset:", error);
    return NextResponse.json({ error: "Failed to fetch style preset" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateApiKeyRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const parsed = stylePresetUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid style preset payload" }, { status: 400 });
    }

    const { id } = await params;
    const preset = await updateStylePresetForUser(auth.userId, id, parsed.data);
    if (!preset) {
      return NextResponse.json({ error: "Style preset not found" }, { status: 404 });
    }

    return NextResponse.json({ data: preset });
  } catch (error) {
    console.error("Failed to update style preset:", error);
    return NextResponse.json({ error: "Failed to update style preset" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateApiKeyRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const deleted = await deleteStylePresetForUser(auth.userId, id);
    if (!deleted) {
      return NextResponse.json({ error: "Style preset not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete style preset:", error);
    return NextResponse.json({ error: "Failed to delete style preset" }, { status: 500 });
  }
}
