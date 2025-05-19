import {
  getRecentQRCodes,
} from "@/lib/qr-service"
import { DashboardClient } from "./client"

export default async function DashboardPage() {
  // Check authentication

  try {
    // Fetch dashboard data
    const qrCodes = await getRecentQRCodes()

    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">My QR Codes</h2>
        </div>

        <div className="flex w-full">
            <DashboardClient initialQRCodes={qrCodes.map(qr => ({
              id: qr.id,
              code: qr.code,
              data: qr.data,
              createdAt: qr.createdAt,
              totalScans: qr.totalScans,
              lastScanned: qr.lastScanned ?? null, // Ensure lastScanned is included
            }))} />
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
