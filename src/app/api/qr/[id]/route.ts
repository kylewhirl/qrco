import { type NextRequest, NextResponse } from "next/server"
import { StackServerApp } from "@stackframe/stack";
import { deleteQR, getQRById, updateQRData } from "@/lib/qr-service"
import type { QRData } from "@/lib/types"

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
    // Parse incoming data object
    const payload = await request.json() as QRData & { name?: string; description?: string }

    // (Optionally validate data.type / payload here)

    // Check if QR code exists
    const qr = await getQRById(id)
    if (!qr) {
      return NextResponse.json({ error: "QR code not found" }, { status: 404 })
    }

    // Update QR code
    const updatedQR = await updateQRData(id, payload)
    return NextResponse.json(updatedQR)
  } catch (error) {
    console.error("Error updating QR code:", error)
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
