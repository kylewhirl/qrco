import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

function SectionHeaderSkeleton() {
  return (
    <CardHeader className="space-y-2 px-3 py-2">
      <Skeleton className="h-5 w-36" />
      <Skeleton className="h-4 w-52" />
    </CardHeader>
  )
}

export function MetricsGridSkeleton() {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} className="gap-0 rounded-none border-2 border-foreground py-0 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 bg-[var(--brand-action)] px-3 py-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </CardHeader>
          <CardContent className="space-y-2 px-3 py-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function ScanActivityChartSkeleton() {
  return (
    <Card className="col-span-4 gap-0 rounded-none border-2 border-foreground py-0 shadow-none">
      <SectionHeaderSkeleton />
      <CardContent className="h-[270px] px-3 pb-2">
        <Skeleton className="h-full w-full" />
      </CardContent>
    </Card>
  )
}

export function QRCodeListSkeleton() {
  return (
    <Card className="gap-0 rounded-none border-2 border-foreground py-0 shadow-none">
      <SectionHeaderSkeleton />
      <CardContent className="space-y-4 px-3 pb-2">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-10 w-44" />
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="grid grid-cols-[minmax(0,1fr)_120px_120px] gap-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function TableCardSkeleton({
  title,
  description,
  columnCount,
  rowCount,
}: {
  title: string
  description: string
  columnCount: number
  rowCount: number
}) {
  return (
    <Card className="gap-0 rounded-none border-2 border-foreground py-0 shadow-none">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 px-3 pb-2">
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}>
          {Array.from({ length: columnCount }).map((_, index) => (
            <Skeleton key={index} className="h-4 w-full" />
          ))}
        </div>
        {Array.from({ length: rowCount }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columnCount }).map((_, columnIndex) => (
              <Skeleton key={columnIndex} className="h-6 w-full" />
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function TopLocationsListSkeleton() {
  return (
    <TableCardSkeleton
      title="Top Locations"
      description="Locations with the most scans"
      columnCount={2}
      rowCount={5}
    />
  )
}

export function LatestScansListSkeleton() {
  return (
    <TableCardSkeleton
      title="Latest Scans"
      description="Recent QR code scans"
      columnCount={3}
      rowCount={5}
    />
  )
}

export function DashboardPageSkeleton() {
  return (
    <div className="flex-1 space-y-3 px-3 py-4 sm:px-4 lg:px-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-40" />
      </div>
      <MetricsGridSkeleton />
      <ScanActivityChartSkeleton />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="md:col-span-2 lg:col-span-4">
          <QRCodeListSkeleton />
        </div>
        <div className="flex flex-col gap-4 md:col-span-2 lg:col-span-3">
          <TopLocationsListSkeleton />
          <LatestScansListSkeleton />
        </div>
      </div>
    </div>
  )
}
