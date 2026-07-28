"use client"

import Link from "next/link"

import { QRImageSquare } from "@/components/qr-image-square"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar"
import type { QRData } from "@/lib/types"
import { formatRelativeDate } from "@/lib/utils"

export interface RecentQRCodeNavItem {
  id: string
  code: string
  data: QRData
  imageUrl?: string | null
  totalScans: number
  lastScanned: string | Date | null
}

function getLabel(item: RecentQRCodeNavItem) {
  return item.data.name?.trim() || item.code
}

function getMeta(item: RecentQRCodeNavItem) {
  const type = item.data.type === "url"
    ? "Website"
    : item.data.type === "sms"
      ? "SMS"
      : item.data.type.charAt(0).toUpperCase() + item.data.type.slice(1)

  if (!item.lastScanned) {
    return `${type} · no scans yet`
  }

  return `${type} · ${formatRelativeDate(item.lastScanned)}`
}

export function NavDocuments({
  items,
  loading = false,
}: {
  items: RecentQRCodeNavItem[]
  loading?: boolean
}) {
  return (
    <SidebarGroup className="border-t border-sidebar-border px-3 py-3 group-data-[collapsible=icon]:hidden">
      <div className="mb-1 flex items-center justify-between">
        <SidebarGroupLabel className="h-6 px-0 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">Recent QR Codes</SidebarGroupLabel>
      </div>

      <SidebarMenu>
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <SidebarMenuSkeleton key={index} showIcon />
          ))
        ) : items.length === 0 ? (
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-auto rounded-xl py-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <Link href="/dashboard/create" className="items-start">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-dashed border-sidebar-border bg-muted text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  New
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-medium">No QR codes yet</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Create your first QR code
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ) : (
          items.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                asChild
                className="h-auto min-h-13 items-start rounded-xl py-1.5 pr-10 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                tooltip={getLabel(item)}
              >
                <Link href={`/dashboard/${item.id}`} className="items-start gap-3">
                  <QRImageSquare qr={item} className="h-9 w-9 rounded-xl border-sidebar-border bg-white" />

                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate font-medium">{getLabel(item)}</span>
                    <span className="line-clamp-2 text-[0.67rem] text-muted-foreground">
                      {getMeta(item)}
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
              <SidebarMenuBadge className="text-muted-foreground">{item.totalScans}</SidebarMenuBadge>
            </SidebarMenuItem>
          ))
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}
