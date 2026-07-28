"use client"

import { Fragment } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { IconBell, IconUserCircle } from "@tabler/icons-react"
import { ThemeToggle } from "./ui/theme-toggle"

const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  "qr-codes": "QR Codes",
  create: "Create",
  styles: "Styles",
  settings: "Settings",
  billing: "Billing",
  folders: "Folders",
  team: "Team",
  help: "Get Help",
  search: "Search",
  notifications: "Notifications",
  account: "Account",
  mobile: "Mobile Creator",
  frame: "Frame Preview",
}

function formatSegment(segment: string, index: number, totalSegments: number) {
  if (LABELS[segment]) {
    return LABELS[segment]
  }

  const looksLikeId = /^[0-9a-f-]{8,}$/i.test(segment) || /^[A-Za-z0-9_-]{6,}$/.test(segment)
  if (looksLikeId && totalSegments > 1 && index === totalSegments - 1) {
    return "QR Details"
  }

  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function SiteHeader() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)
  const dashboardSegments = segments[0] === "dashboard" ? segments : ["dashboard"]

  return (
    <header className="sticky top-0 z-20 flex h-(--header-height) shrink-0 items-center gap-2 border-b border-border bg-[color-mix(in_srgb,var(--card)_88%,transparent)] backdrop-blur-xl transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full min-w-0 items-center gap-1 px-3 lg:gap-2 lg:px-4">
        <SidebarTrigger className="-ml-1 rounded-lg hover:bg-accent" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />

        <Breadcrumb className="min-w-0">
          <BreadcrumbList>
            {dashboardSegments.map((segment, index) => {
              const href = `/${dashboardSegments.slice(0, index + 1).join("/")}`
              const isLast = index === dashboardSegments.length - 1
              const label = formatSegment(segment, index, dashboardSegments.length)

              if (isLast) {
                return (
                  <BreadcrumbItem key={href}>
                    <BreadcrumbPage>{label}</BreadcrumbPage>
                  </BreadcrumbItem>
                )
              }

              return (
                <Fragment key={href}>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href={href}>{label}</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/dashboard/notifications"
            aria-label="Notifications"
            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <IconBell className="size-4" />
          </Link>
          <Link
            href="/dashboard/account"
            aria-label="Account"
            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <IconUserCircle className="size-5" />
          </Link>
        </div>
      </div>
    </header>
  )
}
