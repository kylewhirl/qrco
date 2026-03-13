import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKeyRequest } from "@/lib/api-request-auth";
import { createQRCodeForUser, getAllQRCodesForUser } from "@/lib/qr-service";
import { qrMutationRequestSchema } from "@/lib/qr-validation";

export async function GET(request: NextRequest) {
  const auth = await authenticateApiKeyRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const qrCodes = await getAllQRCodesForUser(auth.userId);
    return NextResponse.json({ data: qrCodes });
  } catch (error) {
    console.error("Failed to list QR codes:", error);
    return NextResponse.json({ error: "Failed to list QR codes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticateApiKeyRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const parsed = qrMutationRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid QR payload" }, { status: 400 });
    }

    const qrCode = await createQRCodeForUser(auth.userId, parsed.data.data, parsed.data.customDomainId);
    return NextResponse.json({ data: qrCode }, { status: 201 });
  } catch (error) {
    console.error("Failed to create QR code:", error);
    return NextResponse.json({ error: "Failed to create QR code" }, { status: 500 });
  }
}
