import { NextRequest, NextResponse } from "next/server";
import { authorizeApiRequest, buildApiPreflightResponse } from "@/lib/api-request-auth";
import { getDailyScanCountsForUser, getDashboardMetricsForUser, getTopLocationsForUser } from "@/lib/qr-service";

export async function GET(request: NextRequest) {
  const authorization = await authorizeApiRequest(request, ["analytics:read"]);
  if (!authorization.ok) {
    return authorization.response;
  }

  try {
    const [metrics, dailyScans, topLocations] = await Promise.all([
      getDashboardMetricsForUser(authorization.value.auth.userId),
      getDailyScanCountsForUser(authorization.value.auth.userId),
      getTopLocationsForUser(authorization.value.auth.userId),
    ]);

    return NextResponse.json({
      data: {
        metrics,
        dailyScans,
        topLocations,
      },
    }, { headers: authorization.value.corsHeaders });
  } catch (error) {
    console.error("Failed to fetch analytics summary:", error);
    return NextResponse.json({ error: "Failed to fetch analytics summary" }, {
      status: 500,
      headers: authorization.value.corsHeaders,
    });
  }
}

export async function OPTIONS(request: NextRequest) {
  return buildApiPreflightResponse(request);
}
