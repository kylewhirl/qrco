import { notFound, redirect } from "next/navigation";

import { QRDetailClient } from "@/components/dashboard/qr-detail-client";
import {
  getDailyScanCountsByQRCode,
  getLatestScansByQRCode,
  getQRById,
  getTopLocationsByQRCode,
} from "@/lib/qr-service";
import { getCurrentUserBillingState } from "@/lib/billing";
import { stackServerApp } from "@/stack";

export default async function QRDetailPage({
  params,
}: {
  params: Promise<{ qrId: string }>
}) {
  const { qrId } = await params;
  const user = await stackServerApp.getUser();
  if (!user) {
    redirect("/login");
  }

  const billingState = await getCurrentUserBillingState();
  const [qr, dailyScanCounts, latestScans, topLocations] = await Promise.all([
    getQRById(qrId),
    getDailyScanCountsByQRCode(qrId),
    getLatestScansByQRCode(qrId, 12),
    billingState.plan.access.advanced_analytics ? getTopLocationsByQRCode(qrId, 5) : Promise.resolve([]),
  ]);

  if (!qr) {
    notFound();
  }

  return (
    <QRDetailClient
      initialQR={qr}
      dailyScanCounts={dailyScanCounts}
      latestScans={latestScans}
      topLocations={topLocations}
      advancedAnalyticsEnabled={billingState.plan.access.advanced_analytics}
    />
  );
}
