import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKeyRequest } from "@/lib/api-request-auth";
import { getDailyScanCountsForUser, getDashboardMetricsForUser, getTopLocationsForUser } from "@/lib/qr-service";

export async function GET(request: NextRequest) {
  const auth = await authenticateApiKeyRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [metrics, dailyScans, topLocations] = await Promise.all([
      getDashboardMetricsForUser(auth.userId),
      getDailyScanCountsForUser(auth.userId),
      getTopLocationsForUser(auth.userId),
    ]);

    return NextResponse.json({
      data: {
        metrics,
        dailyScans,
        topLocations,
      },
    });
  } catch (error) {
    console.error("Failed to fetch analytics summary:", error);
    return NextResponse.json({ error: "Failed to fetch analytics summary" }, { status: 500 });
  }
}
