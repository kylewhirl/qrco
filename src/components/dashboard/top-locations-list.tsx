import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { TopLocation } from "@/lib/types"
import { formatNumber } from "@/lib/utils"

interface TopLocationsListProps {
  locations: TopLocation[]
}

export function TopLocationsList({ locations }: TopLocationsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Locations</CardTitle>
        <CardDescription>Locations with the most scans</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Scans</TableHead>
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
