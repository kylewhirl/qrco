import { notFound } from "next/navigation";

import { QRDetailClient } from "@/components/dashboard/qr-detail-client";
import {
  getDailyScanCountsByQRCode,
  getLatestScansByQRCode,
  getQRById,
  getTopLocationsByQRCode,
} from "@/lib/qr-service";

export default async function QRDetailPage({
  params,
}: {
  params: Promise<{ qrId: string }>
}) {
  const { qrId } = await params;

  const [qr, dailyScanCounts, latestScans, topLocations] = await Promise.all([
    getQRById(qrId),
    getDailyScanCountsByQRCode(qrId),
    getLatestScansByQRCode(qrId, 12),
    getTopLocationsByQRCode(qrId, 5),
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
    />
  );
}
