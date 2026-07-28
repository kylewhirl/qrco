"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DailyScanCount } from "@/lib/types"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { formatRelativeDate } from "@/lib/utils"

interface ScanActivityChartProps {
  data: DailyScanCount[]
}

export function ScanActivityChart({ data }: ScanActivityChartProps) {
  const [range, setRange] = useState<7 | 30 | 90>(30)
  const chartData = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return Array.from({ length: range }).map((_, i) => {
      const date = new Date(today)
      date.setDate(date.getDate() - (range - 1 - i))
      const isoDate = date.toISOString().split("T")[0]
      const matching = data.find((d) => d.date === isoDate)

      return {
        date: isoDate,
        scans: matching?.count ?? 0,
      }
    })
  }, [data, range])

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
        <text dy={12} textAnchor="middle" className="fill-foreground text-[10px] font-semibold">
          {day}
        </text>
        {(isFirstOfMonth || isFirstTick) && (
          <text dy={24} textAnchor="middle" className="fill-muted-foreground text-[9px]">
            {month}
          </text>
        )}
      </g>
    )
  }

    // Limit x-axis to roughly 7 ticks
  const maxTicks = range === 7 ? 7 : 10;
  const step = Math.floor((chartData.length - 1) / (maxTicks - 1)) || 1;
  const ticks = chartData
    .filter((_, i) => i % step === 0)
    .map((d) => d.date);

  return (
    <Card className="col-span-4 gap-0 border border-border bg-card py-0">
      <CardHeader className="flex flex-row items-start justify-between gap-3 px-5 pt-5">
        <div>
          <CardTitle className="font-display text-lg tracking-[-0.025em]">Scan activity</CardTitle>
          <p className="mt-1 text-xs font-medium text-muted-foreground">Daily scan counts for the past {range} days</p>
        </div>
        <div className="flex shrink-0 rounded-xl bg-muted p-1" aria-label="Chart date range">
          {([7, 30, 90] as const).map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setRange(days)}
              aria-pressed={range === days}
              className="h-7 min-w-10 rounded-lg px-2 text-[0.65rem] font-bold text-muted-foreground transition hover:text-foreground aria-pressed:bg-card aria-pressed:text-[var(--brand-blue)] aria-pressed:shadow-sm"
            >
              {days}D
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="h-[250px] px-3 pb-3 sm:h-[280px] sm:px-5">
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
            margin={{ top: 8, right: 8, left: -10, bottom: 26 }}
          >
            <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.16} strokeDasharray="2 3" />
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
              width={28}
              allowDecimals={false}
              tick={{ fontSize: 10, fontWeight: 600 }}
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
              labelFormatter={(value: string) => {
                return formatRelativeDate(value)
              }}
            />
            <Line
              type="linear"
              dataKey="scans"
              stroke="var(--brand-blue)"
              strokeWidth={2}
              dot={{ r: 2.5, fill: "var(--brand-blue)", stroke: "var(--brand-blue)" }}
              activeDot={{ r: 5, fill: "var(--brand-lime)", stroke: "#090909", strokeWidth: 1.5 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
