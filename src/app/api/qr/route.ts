import { type NextRequest, NextResponse } from "next/server"
import { createQRCode, getAllQRCodes } from "@/lib/qr-service"
import { isValidURL } from "@/lib/utils"
import { StackServerApp } from "@stackframe/stack";
import type { QRData } from "@/lib/types";

const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  urls: {
    signIn: "/login",
  },
});

// Create a new QR code
export async function POST(request: NextRequest) {
  // Check authentication with Stack Auth
  const user = await stackServerApp.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json() as QRData & { domain_id?: string };
    const { domain_id, ...data } = body;

    if (data.type !== "url") {
      return NextResponse.json({ error: "Invalid payload type" }, { status: 400 });
    }

    const { url } = data;

    // Validate url
    if (!url || !isValidURL(url)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Create QR code
    const qr = await createQRCode(data, domain_id ?? null);
    return NextResponse.json(qr);
  } catch (error) {
    console.error("Error creating QR code:", error);
    return NextResponse.json({ error: "Failed to create QR code" }, { status: 500 });
  }
}

// Get all QR codes
export async function GET() {
  // Check authentication with Stack Auth
  const user = await stackServerApp.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const qrCodes = await getAllQRCodes();
    return NextResponse.json(qrCodes);
  } catch (error) {
    console.error("Error fetching QR codes:", error);
    return NextResponse.json({ error: "Failed to fetch QR codes" }, { status: 500 });
  }
}
