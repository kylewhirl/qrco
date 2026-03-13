import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKeyRequest } from "@/lib/api-request-auth";
import { getLatestScansByQRCodeForUser } from "@/lib/qr-service";

function getLimit(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("limit");
  if (!raw) {
    return 100;
  }

  const limit = Number.parseInt(raw, 10);
  if (Number.isNaN(limit)) {
    return 100;
  }

  return Math.min(Math.max(limit, 1), 500);
}

export async function GET(request: NextRequest) {
  const auth = await authenticateApiKeyRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const qrId = request.nextUrl.searchParams.get("qrId") ?? undefined;
    const limit = getLimit(request);
    const scans = await getLatestScansByQRCodeForUser(auth.userId, qrId, limit);

    return NextResponse.json({ data: scans });
  } catch (error) {
    console.error("Failed to fetch scans:", error);
    return NextResponse.json({ error: "Failed to fetch scans" }, { status: 500 });
  }
}
