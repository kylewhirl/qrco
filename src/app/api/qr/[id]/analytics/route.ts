import { type NextRequest, NextResponse } from "next/server";
import { StackServerApp } from "@stackframe/stack";

import {
  getDailyScanCountsByQRCode,
  getQRById,
  getTopLocationsByQRCode,
} from "@/lib/qr-service";

const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  urls: { signIn: "/login" },
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await stackServerApp.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const qr = await getQRById(id);
    if (!qr) {
      return NextResponse.json({ error: "QR code not found" }, { status: 404 });
    }

    const [dailyScans, topLocations] = await Promise.all([
      getDailyScanCountsByQRCode(id),
      getTopLocationsByQRCode(id, 3),
    ]);

    return NextResponse.json({
      totalScans: qr.totalScans,
      dailyScans,
      topLocations,
    });
  } catch (error) {
    console.error("Failed to load QR analytics:", error);
    return NextResponse.json({ error: "Failed to load QR analytics" }, { status: 500 });
  }
}
