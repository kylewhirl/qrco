import { Suspense } from "react"
import {
  IconActivity,
  IconChartLine,
  IconMapPin,
  IconQrcode,
} from "@tabler/icons-react"
import { redirect } from "next/navigation"
import { FeatureLockCard } from "@/components/billing/feature-lock-card"
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
import { getCurrentUserBillingState } from "@/lib/billing"
import type { DailyScanCount, DashboardMetrics, LatestScan, QR, TopLocation } from "@/lib/types"
import { formatNumber } from "@/lib/utils"
import { stackServerApp } from "@/stack"
import { DashboardClient } from "./client"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const user = await stackServerApp.getUser()
  if (!user) {
    redirect("/login")
  }

  const billingState = await getCurrentUserBillingState()
  const metricsPromise = getDashboardMetrics()
  const dailyScanCountsPromise = getDailyScanCounts()
  const qrCodesPromise = getRecentQRCodes()
  const topLocationsPromise = billingState.plan.access.advanced_analytics ? getTopLocations() : Promise.resolve([])
  const latestScansPromise = getLatestScans()

  return (
    <div className="relative flex-1 space-y-5 overflow-hidden px-3 py-5 sm:px-5 lg:px-7 lg:py-7">
      <div className="relative z-10 flex items-end justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.12em] text-[var(--brand-blue)]">Overview</p>
          <h1 className="font-display text-[clamp(2.2rem,5vw,3.25rem)] leading-none tracking-[-0.05em]">Dashboard</h1>
        </div>
      </div>

      <div className="relative z-10 space-y-5">
        <Suspense fallback={<MetricsGridSkeleton />}>
          <MetricsSection metricsPromise={metricsPromise} />
        </Suspense>

        <Suspense fallback={<ScanActivityChartSkeleton />}>
          <ScanActivitySection dailyScanCountsPromise={dailyScanCountsPromise} />
        </Suspense>

        <div className="grid min-w-0 gap-5 lg:grid-cols-7">
          <div className="box-border min-w-0 overflow-hidden lg:col-span-4">
            <Suspense fallback={<QRCodeListSkeleton />}>
              <RecentQRCodesSection qrCodesPromise={qrCodesPromise} />
            </Suspense>
          </div>
          <div className="flex min-w-0 flex-col gap-5 lg:col-span-3">
            <Suspense fallback={<TopLocationsListSkeleton />}>
              <TopLocationsSection
                topLocationsPromise={topLocationsPromise}
                locked={!billingState.plan.access.advanced_analytics}
              />
            </Suspense>
            <Suspense fallback={<LatestScansListSkeleton />}>
              <LatestScansSection latestScansPromise={latestScansPromise} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}

async function MetricsSection({ metricsPromise }: { metricsPromise: Promise<DashboardMetrics> }) {
  try {
    const metrics = await metricsPromise

    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricsCard
          title="Total Scans (7 days)"
          value={formatNumber(metrics.totalScansLast7Days)}
          icon={<IconChartLine className="h-4 w-4" />}
        />
        <MetricsCard
          title="Active QR Codes"
          value={formatNumber(metrics.activeQRCodesCount)}
          icon={<IconQrcode className="h-4 w-4" />}
        />
        <MetricsCard
          title="Top Location"
          value={metrics.topLocation?.location || "N/A"}
          description={metrics.topLocation ? `${formatNumber(metrics.topLocation.count)} scans` : "No data"}
          icon={<IconMapPin className="h-4 w-4" />}
        />
        <MetricsCard
          title="Most Active QR"
          value={metrics.mostActiveQR?.code || "N/A"}
          description={metrics.mostActiveQR ? `${formatNumber(metrics.mostActiveQR.scans)} scans` : "No data"}
          icon={<IconActivity className="h-4 w-4" />}
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
  locked,
}: {
  topLocationsPromise: Promise<TopLocation[]>
  locked: boolean
}) {
  if (locked) {
    return (
      <FeatureLockCard
        title="Advanced analytics are locked"
        description="Upgrade to Creator to unlock top locations and the rest of the extended analytics views."
      />
    )
  }

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
    <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
      {title}
    </div>
  )
}
