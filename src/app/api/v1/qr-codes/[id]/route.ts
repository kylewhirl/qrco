import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKeyRequest } from "@/lib/api-request-auth";
import { deleteQRForUser, getQRByIdForUser, updateQRDataForUser } from "@/lib/qr-service";
import { qrMutationRequestSchema } from "@/lib/qr-validation";

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
    const qrCode = await getQRByIdForUser(auth.userId, id);
    if (!qrCode) {
      return NextResponse.json({ error: "QR code not found" }, { status: 404 });
    }

    return NextResponse.json({ data: qrCode });
  } catch (error) {
    console.error("Failed to get QR code:", error);
    return NextResponse.json({ error: "Failed to get QR code" }, { status: 500 });
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
    const parsed = qrMutationRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid QR payload" }, { status: 400 });
    }

    const { id } = await params;
    const qrCode = await updateQRDataForUser(auth.userId, id, parsed.data.data, parsed.data.customDomainId);
    if (!qrCode) {
      return NextResponse.json({ error: "QR code not found" }, { status: 404 });
    }

    return NextResponse.json({ data: qrCode });
  } catch (error) {
    console.error("Failed to update QR code:", error);
    return NextResponse.json({ error: "Failed to update QR code" }, { status: 500 });
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
    const deleted = await deleteQRForUser(auth.userId, id);
    if (!deleted) {
      return NextResponse.json({ error: "QR code not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete QR code:", error);
    return NextResponse.json({ error: "Failed to delete QR code" }, { status: 500 });
  }
}
