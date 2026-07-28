import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { LatestScan } from "@/lib/types"
import { formatDate } from "@/lib/utils"

interface LatestScansListProps {
  scans: LatestScan[]
}

export function LatestScansList({ scans }: LatestScansListProps) {
  return (
    <Card className="min-w-0 gap-0 border border-border bg-card py-0">
      <CardHeader className="px-5 pt-5">
        <CardTitle className="font-display text-lg">Latest scans</CardTitle>
        <CardDescription className="text-xs">Recent QR code scans</CardDescription>
      </CardHeader>
      <CardContent className="min-w-0 overflow-x-auto px-5 pb-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="h-8 text-[0.64rem] font-black uppercase tracking-[0.1em]">Code</TableHead>
              <TableHead className="h-8 text-[0.64rem] font-black uppercase tracking-[0.1em]">Scanned At</TableHead>
              <TableHead className="h-8 text-[0.64rem] font-black uppercase tracking-[0.1em]">Location</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="w-full overflow-x-auto">
            {scans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  No scans recorded yet
                </TableCell>
              </TableRow>
            ) : (
              scans.map((scan) => (
                <TableRow key={scan.id}>
                  <TableCell className="font-medium">{scan.data?.name ? scan.data.name : scan.code}</TableCell>
                  <TableCell >{formatDate(scan.scannedAt)}</TableCell>
                  <TableCell>{scan.location || "Unknown"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
