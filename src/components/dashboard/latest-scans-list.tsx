import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { LatestScan } from "@/lib/types"
import { formatDate } from "@/lib/utils"

interface LatestScansListProps {
  scans: LatestScan[]
}

export function LatestScansList({ scans }: LatestScansListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Latest Scans</CardTitle>
        <CardDescription>Recent QR code scans</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Scanned At</TableHead>
              <TableHead>Location</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  No scans recorded yet
                </TableCell>
              </TableRow>
            ) : (
              scans.map((scan) => (
                <TableRow key={scan.id}>
                  <TableCell className="font-medium">{scan.code}</TableCell>
                  <TableCell>{formatDate(scan.scannedAt)}</TableCell>
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
