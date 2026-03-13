"use client"

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
    <header className="sticky top-0 z-10 flex h-(--header-height) shrink-0 items-center gap-2 rounded-t-lg border-b bg-background transition-[width,height] ease-linear md:top-2 group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />

        <Breadcrumb>
          <BreadcrumbList>
            {dashboardSegments.map((segment, index) => {
              const href = `/${dashboardSegments.slice(0, index + 1).join("/")}`
              const isLast = index === dashboardSegments.length - 1
              const label = formatSegment(segment, index, dashboardSegments.length)

              return (
                <BreadcrumbItem key={href}>
                  {isLast ? (
                    <BreadcrumbPage>{label}</BreadcrumbPage>
                  ) : (
                    <>
                      <BreadcrumbLink asChild>
                        <Link href={href}>{label}</Link>
                      </BreadcrumbLink>
                      <BreadcrumbSeparator />
                    </>
                  )}
                </BreadcrumbItem>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
