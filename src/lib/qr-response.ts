import "server-only";

import { type NextRequest, NextResponse } from "next/server";
import type { QR } from "@/lib/types";
import { buildSignedUrl } from "@/lib/storage";
import { logScan } from "@/lib/qr-service";
import { serialize } from "@/lib/utils";

export async function buildQrResponse(request: NextRequest, qr: QR): Promise<NextResponse> {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1";

  try {
    await logScan(qr.id, ip);
  } catch (err) {
    console.error("logScan failed:", err);
  }

  switch (qr.data.type) {
    case "url":
      return NextResponse.redirect(qr.data.url, { status: 307 });

    case "text":
      return new NextResponse(qr.data.text, {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });

    case "file": {
      const fileUrl = await buildSignedUrl(qr.data.key);
      return NextResponse.redirect(fileUrl, { status: 307 });
    }

    case "email": {
      const { to, subject, body } = qr.data;
      const mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      return NextResponse.redirect(mailto, { status: 307 });
    }

    case "phone":
      return NextResponse.redirect(`tel:${qr.data.number}`, { status: 307 });

    case "sms": {
      const { number, message } = qr.data;
      const smsUrl = `sms:${number}?&body=${encodeURIComponent(message)}`;
      return NextResponse.redirect(smsUrl, { status: 307 });
    }

    case "contact":
      return new NextResponse(serialize(qr.data), {
        status: 200,
        headers: {
          "Content-Type": "text/vcard; charset=utf-8",
          "Content-Disposition": `inline; filename="${qr.code}.vcf"`,
        },
      });

    case "wifi": {
      const { ssid, authenticationType, password } = qr.data;
      const wifiString = `WIFI:S:${ssid};T:${authenticationType};P:${password};;`;
      return new NextResponse(wifiString, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    default:
      return NextResponse.json({ error: "Unsupported QR payload" }, { status: 404 });
  }
}
