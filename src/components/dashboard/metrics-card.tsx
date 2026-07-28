import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ReactNode } from "react"

interface MetricsCardProps {
  title: string
  value: string | number
  description?: string
  icon?: ReactNode
}

export function MetricsCard({ title, value, description, icon }: MetricsCardProps) {
  return (
    <Card className="group gap-0 overflow-hidden border border-border bg-card py-0 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-30px_color-mix(in_srgb,var(--brand-blue)_55%,transparent)]">
      <CardHeader className="flex min-h-10 flex-row items-center justify-between space-y-0 px-4 pt-4">
        <CardTitle className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">{title}</CardTitle>
        {icon && <div className="grid size-9 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--brand-blue)_9%,var(--card))] text-[var(--brand-blue)]">{icon}</div>}
      </CardHeader>
      <CardContent className="min-h-[92px] px-4 pb-4 pt-2">
        <div className="font-display max-w-full truncate text-[clamp(1.8rem,4vw,2.6rem)] leading-none tracking-[-0.05em]">{value}</div>
        {description && <p className="mt-2 text-[0.72rem] font-semibold text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  )
}
