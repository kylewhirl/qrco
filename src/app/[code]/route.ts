import { buildSignedUrl } from "@/lib/storage"; // or wherever you generate file URLs
import { type NextRequest, NextResponse } from "next/server"
import { getQRByCode, logScan } from "@/lib/qr-service"

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params

  // Get the QR code from the database
  const qr = await getQRByCode(code)

  // If QR code not found, return 404
  if (!qr) {
    return NextResponse.redirect(new URL("/not-found", request.url))
  }

  // Get client IP address
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1"

  // Log the scan asynchronously (don't wait for it to complete)
  try {
    await logScan(qr.id, ip)
  } catch (err) {
    console.error("logScan failed:", err)
  }

  // Determine action based on QR type
  switch (qr.data.type) {
    case "url":
      // Standard URL redirect
      return NextResponse.redirect(qr.data.url, { status: 307 });

    case "file":
      // Redirect to a signed or public URL for download
      // Assumes qr.data.key holds the file key in R2 or storage
      // If you have a helper to build a signed URL, use it here
      const fileUrl = await buildSignedUrl(qr.data.key);
      return NextResponse.redirect(fileUrl, { status: 307 });

    case "email":
      // Assumes qr.data is an object { to, subject, body }
      const { to, subject, body } = qr.data;
      const mailto = `mailto:${to}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;
      return NextResponse.redirect(mailto, { status: 307 });

    case "phone":
      // qr.data.number is a phone number string
      return NextResponse.redirect(`tel:${qr.data.number}`, {
        status: 307,
      });

    case "sms":
      // Assumes qr.data is { number, message }
      const { number, message } = qr.data;
      const smsUrl = `sms:${number}?&body=${encodeURIComponent(message)}`;
      return NextResponse.redirect(smsUrl, { status: 307 });

    case "wifi":
      // Assumes qr.data is { ssid, authenticationType, password }
      const { ssid, authenticationType, password } = qr.data;
      // Output the raw WIFI QR schema; many scanners/OSes handle it
      const wifiString = `WIFI:S:${ssid};T:${authenticationType};P:${password};;`;
      return new NextResponse(wifiString, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });

    default:
      // Fallback to not found
      return NextResponse.redirect(new URL("/not-found", request.url));
  }
}
