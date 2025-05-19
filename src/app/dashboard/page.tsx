
import {
  getDailyScanCounts,
  getDashboardMetrics,
  getLatestScans,
  getRecentQRCodes,
  getTopLocations,
} from "@/lib/qr-service"
import { MetricsCard } from "@/components/dashboard/metrics-card"
import { ScanActivityChart } from "@/components/dashboard/scan-activity-chart"
import { TopLocationsList } from "@/components/dashboard/top-locations-list"
import { LatestScansList } from "@/components/dashboard/latest-scans-list"
import { formatNumber } from "@/lib/utils"
import { BarChart, Clock, MapPin, QrCode } from "lucide-react"
import { DashboardClient } from "./client"

export default async function DashboardPage() {

  try {
    // Fetch dashboard data
    const metrics = await getDashboardMetrics()
    const dailyScanCounts = await getDailyScanCounts()
    const qrCodes = await getRecentQRCodes()
    const topLocations = await getTopLocations()
    const latestScans = await getLatestScans()

    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>

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

        <ScanActivityChart data={dailyScanCounts} />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <div className="md:col-span-2 lg:col-span-4 w-full max-w-full box-border overflow-x-hidden">
            <DashboardClient initialQRCodes={qrCodes.map(qr => ({
              id: qr.id,
              code: qr.code,
              data: qr.data,
              createdAt: qr.createdAt,
              totalScans: qr.totalScans,
              lastScanned: qr.lastScanned ?? null, // Ensure lastScanned is included
            }))} />
          </div>
          <div className="grid gap-4 md:col-span-2 lg:col-span-3">
            <TopLocationsList locations={topLocations} />
            <LatestScansList scans={latestScans} />
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Dashboard error:", error)
    return (
      <div className="flex-1 p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h2 className="text-lg font-medium text-red-800">Error loading dashboard</h2>
          <p className="mt-2 text-red-700">
            There was an error loading the dashboard data. Please try again later or contact support.
          </p>
        </div>
      </div>
    )
  }
}
