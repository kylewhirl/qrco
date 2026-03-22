import { Suspense } from "react"
import { BarChart, Clock, MapPin, QrCode } from "lucide-react"
import { MetricsCard } from "@/components/dashboard/metrics-card"
import { ScanActivityChart } from "@/components/dashboard/scan-activity-chart"
import { TopLocationsList } from "@/components/dashboard/top-locations-list"
import { LatestScansList } from "@/components/dashboard/latest-scans-list"
import {
  LatestScansListSkeleton,
  MetricsGridSkeleton,
  QRCodeListSkeleton,
  ScanActivityChartSkeleton,
  TopLocationsListSkeleton,
} from "@/components/dashboard/dashboard-skeletons"
import {
  getDailyScanCounts,
  getDashboardMetrics,
  getLatestScans,
  getRecentQRCodes,
  getTopLocations,
} from "@/lib/qr-service"
import type { DailyScanCount, DashboardMetrics, LatestScan, QR, TopLocation } from "@/lib/types"
import { formatNumber } from "@/lib/utils"
import { DashboardClient } from "./client"

export const dynamic = "force-dynamic"

export default function DashboardPage() {
  const metricsPromise = getDashboardMetrics()
  const dailyScanCountsPromise = getDailyScanCounts()
  const qrCodesPromise = getRecentQRCodes()
  const topLocationsPromise = getTopLocations()
  const latestScansPromise = getLatestScans()

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      <Suspense fallback={<MetricsGridSkeleton />}>
        <MetricsSection metricsPromise={metricsPromise} />
      </Suspense>

      <Suspense fallback={<ScanActivityChartSkeleton />}>
        <ScanActivitySection dailyScanCountsPromise={dailyScanCountsPromise} />
      </Suspense>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="box-border w-full max-w-full overflow-x-hidden md:col-span-2 lg:col-span-4">
          <Suspense fallback={<QRCodeListSkeleton />}>
            <RecentQRCodesSection qrCodesPromise={qrCodesPromise} />
          </Suspense>
        </div>
        <div className="flex w-full flex-col gap-4 md:col-span-2 lg:col-span-3">
          <Suspense fallback={<TopLocationsListSkeleton />}>
            <TopLocationsSection topLocationsPromise={topLocationsPromise} />
          </Suspense>
          <Suspense fallback={<LatestScansListSkeleton />}>
            <LatestScansSection latestScansPromise={latestScansPromise} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

async function MetricsSection({ metricsPromise }: { metricsPromise: Promise<DashboardMetrics> }) {
  try {
    const metrics = await metricsPromise

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricsCard
          title="Total Scans (7 days)"
          value={formatNumber(metrics.totalScansLast7Days)}
          icon={<BarChart className="h-4 w-4" />}
        />
        <MetricsCard
          title="Active QR Codes"
          value={formatNumber(metrics.activeQRCodesCount)}
          icon={<QrCode className="h-4 w-4" />}
        />
        <MetricsCard
          title="Top Location"
          value={metrics.topLocation?.location || "N/A"}
          description={metrics.topLocation ? `${formatNumber(metrics.topLocation.count)} scans` : "No data"}
          icon={<MapPin className="h-4 w-4" />}
        />
        <MetricsCard
          title="Most Active QR"
          value={metrics.mostActiveQR?.code || "N/A"}
          description={metrics.mostActiveQR ? `${formatNumber(metrics.mostActiveQR.scans)} scans` : "No data"}
          icon={<Clock className="h-4 w-4" />}
        />
      </div>
    )
  } catch (error) {
    console.error("Dashboard metrics error:", error)
    return <DashboardSectionError title="Error loading dashboard metrics." />
  }
}

async function ScanActivitySection({
  dailyScanCountsPromise,
}: {
  dailyScanCountsPromise: Promise<DailyScanCount[]>
}) {
  try {
    const dailyScanCounts = await dailyScanCountsPromise
    return <ScanActivityChart data={dailyScanCounts} />
  } catch (error) {
    console.error("Dashboard scan activity error:", error)
    return <DashboardSectionError title="Error loading scan activity." />
  }
}

async function RecentQRCodesSection({ qrCodesPromise }: { qrCodesPromise: Promise<QR[]> }) {
  try {
    const qrCodes = await qrCodesPromise

    return (
      <DashboardClient
        initialQRCodes={qrCodes.map((qr) => ({
          id: qr.id,
          code: qr.code,
          data: qr.data,
          imageUrl: qr.imageUrl ?? null,
          customDomainId: qr.customDomainId ?? null,
          customHostname: qr.customHostname ?? null,
          publicUrl: qr.publicUrl,
          createdAt: qr.createdAt,
          totalScans: qr.totalScans,
          lastScanned: qr.lastScanned ?? null,
        }))}
      />
    )
  } catch (error) {
    console.error("Dashboard QR codes error:", error)
    return <DashboardSectionError title="Error loading QR codes." />
  }
}

async function TopLocationsSection({
  topLocationsPromise,
}: {
  topLocationsPromise: Promise<TopLocation[]>
}) {
  try {
    const topLocations = await topLocationsPromise
    return <TopLocationsList locations={topLocations} />
  } catch (error) {
    console.error("Dashboard top locations error:", error)
    return <DashboardSectionError title="Error loading top locations." />
  }
}

async function LatestScansSection({
  latestScansPromise,
}: {
  latestScansPromise: Promise<LatestScan[]>
}) {
  try {
    const latestScans = await latestScansPromise
    return <LatestScansList scans={latestScans} />
  } catch (error) {
    console.error("Dashboard latest scans error:", error)
    return <DashboardSectionError title="Error loading latest scans." />
  }
}

function DashboardSectionError({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
      {title}
    </div>
  )
}
