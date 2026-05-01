import { type NextRequest, NextResponse } from "next/server"
import { StackServerApp } from "@stackframe/stack";
import { BillingAccessError } from "@/lib/billing";
import { deleteQR, getQRById, QRSlugUnavailableError, QRSlugValidationError, updateQRData } from "@/lib/qr-service"
import { qrMutationRequestSchema } from "@/lib/qr-validation";

const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  urls: { signIn: "/login" },
});

// Update QR code destination
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Check authentication with Stack Auth
  const user = await stackServerApp.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const parsed = qrMutationRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { data, customDomainId, customSlug } = parsed.data;

    // Check if QR code exists
    const qr = await getQRById(id)
    if (!qr) {
      return NextResponse.json({ error: "QR code not found" }, { status: 404 })
    }

    // Update QR code
    const updatedQR = await updateQRData(id, data, customDomainId, customSlug)
    return NextResponse.json(updatedQR)
  } catch (error) {
    console.error("Error updating QR code:", error)
    if (error instanceof BillingAccessError) {
      return NextResponse.json(
        { error: error.message, code: error.code, requiredTier: error.requiredTier },
        { status: error.status },
      )
    }
    if (error instanceof QRSlugUnavailableError || error instanceof QRSlugValidationError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    }

    return NextResponse.json({ error: "Failed to update QR code" }, { status: 500 })
  }
}

// Delete QR code
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Check authentication with Stack Auth
  const user = await stackServerApp.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if QR code exists
    const qr = await getQRById(id)
    if (!qr) {
      return NextResponse.json({ error: "QR code not found" }, { status: 404 })
    }

    // Delete QR code
    const success = await deleteQR(id)
    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Failed to delete QR code" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error deleting QR code:", error)
    return NextResponse.json({ error: "Failed to delete QR code" }, { status: 500 })
  }
}
