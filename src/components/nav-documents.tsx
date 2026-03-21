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
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <div className="mb-2 flex items-center justify-between">
        <SidebarGroupLabel>Recent QR Codes</SidebarGroupLabel>
      </div>

      <SidebarMenu>
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <SidebarMenuSkeleton key={index} showIcon />
          ))
        ) : items.length === 0 ? (
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-auto py-2">
              <Link href="/dashboard/create" className="items-start">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-dashed border-sidebar-border bg-sidebar-accent/40 text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/60">
                  New
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-medium">No QR codes yet</span>
                  <span className="truncate text-xs text-sidebar-foreground/60">
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
                className="h-auto min-h-14 items-start py-2 pr-10"
                tooltip={getLabel(item)}
              >
                <Link href={`/dashboard/${item.id}`} className="items-start gap-3">
                  <QRImageSquare qr={item} className="h-10 w-10 rounded-xl border-sidebar-border" />

                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate font-medium">{getLabel(item)}</span>
                    <span className="line-clamp-2 text-xs text-sidebar-foreground/60">
                      {getMeta(item)}
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
              <SidebarMenuBadge>{item.totalScans}</SidebarMenuBadge>
            </SidebarMenuItem>
          ))
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}
