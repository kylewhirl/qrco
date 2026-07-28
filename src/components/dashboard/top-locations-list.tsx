import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { TopLocation } from "@/lib/types"
import { formatNumber } from "@/lib/utils"

interface TopLocationsListProps {
  locations: TopLocation[]
}

export function TopLocationsList({ locations }: TopLocationsListProps) {
  return (
    <Card className="min-w-0 gap-0 border border-border bg-card py-0">
      <CardHeader className="px-5 pt-5">
        <CardTitle className="font-display text-lg">Top locations</CardTitle>
        <CardDescription className="text-xs">Locations with the most scans</CardDescription>
      </CardHeader>
      <CardContent className="min-w-0 overflow-x-auto px-5 pb-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="h-8 text-[0.64rem] font-black uppercase tracking-[0.1em]">Location</TableHead>
              <TableHead className="h-8 text-right text-[0.64rem] font-black uppercase tracking-[0.1em]">Scans</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="w-full overflow-x-auto">
            {locations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center">
                  No data available
                </TableCell>
              </TableRow>
            ) : (
              locations.map((location, index) => (
                <TableRow key={index}>
                  <TableCell>{location.location || "Unknown"}</TableCell>
                  <TableCell className="text-right">{formatNumber(location.count)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
