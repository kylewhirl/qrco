"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { DailyScanCount } from "@/lib/types"
import { Line, LineChart, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { formatRelativeDate } from "@/lib/utils"

interface ScanActivityChartProps {
  data: DailyScanCount[]
}

export function ScanActivityChart({ data }: ScanActivityChartProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const chartData = Array.from({ length: 30 }).map((_, i) => {
    const date = new Date(today)
    date.setDate(date.getDate() - (29 - i))
    const isoDate = date.toISOString().split("T")[0]
    const matching = data.find((d) => d.date === isoDate)
    const count = matching?.count ?? 0;
    return {
      date: isoDate,
      scans: count > 0 ? count : null,
    }
  })

  interface CustomTickProps {
    x?: number
    y?: number
    payload: {
      value: string
    }
  }

  const renderDayTick = ({ x = 0, y = 0, payload }: CustomTickProps) => {
    const date = new Date(`${payload.value}T00:00:00`)
    const day = date.getDate()
    const month = date.toLocaleString("default", { month: "long" })

    const isFirstOfMonth = day === 1
    const isFirstTick = payload.value === chartData[0].date

    return (
      <g transform={`translate(${x},${y})`}>
        <text dy={12} textAnchor="middle" className="fill-foreground text-xs">
          {day}
        </text>
        {(isFirstOfMonth || isFirstTick) && (
          <text dy={24} textAnchor="middle" className="fill-muted text-xs">
            {month}
          </text>
        )}
      </g>
    )
  }

    // Limit x-axis to roughly 7 ticks
  const maxTicks = 14;
  const step = Math.floor((chartData.length - 1) / (maxTicks - 1)) || 1;
  const ticks = chartData
    .filter((_, i) => i % step === 0)
    .map((d) => d.date);

  console.log(ticks)

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Scan Activity</CardTitle>
        <CardDescription>Daily scan counts for the past 30 days</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ChartContainer
          config={{
            scans: {
              label: "Scans",
              color: "hsl(var(--chart-1))",
            },
          }}
          className="h-full w-full"
        >
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 10, left: 0, bottom: 30 }}
          >
            <XAxis
              dataKey="date"
              type="category"
              ticks={ticks}
              tick={renderDayTick}
              tickLine={false}
              axisLine={false}
              padding={{ left: 10, right: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={30}
              allowDecimals={false}
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
              labelFormatter={(value: string) => {
                return formatRelativeDate(value)
              }}
            />
            <Line type="monotone" dataKey="scans" connectNulls={false} strokeWidth={2} activeDot={{ r: 6 }} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
