"use client"

import * as React from "react"
import {
  IconDashboard,
  IconFolder,
  IconHelp,
  IconSearch,
  IconSettings,
  IconUsers,
  IconQrcode,
  IconCreditCard,
  IconBrush,
  IconPackage,
} from "@tabler/icons-react"

import { NavDocuments, type RecentQRCodeNavItem } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Logo from "@/assets/logo";
import { TypingMorph } from "@/components/ui/typing-morph"
import Link from "next/link"

export const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "My QR Codes",
      url: "/dashboard/qr-codes",
      icon: IconQrcode,
    },
    {
      title: "Products",
      url: "/dashboard/products",
      icon: IconPackage,
    },
    {
      title: "Folders",
      url: "/dashboard/folders",
      icon: IconFolder,
    },
    {
      title: "Styles",
      url: "/dashboard/styles",
      icon: IconBrush,
    },
    {
      title: "Team",
      url: "/dashboard/team",
      icon: IconUsers,
    },
    {
      title: "Billing",
      url: "/dashboard/billing",
      icon: IconCreditCard,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "/dashboard/help",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "/dashboard/search",
      icon: IconSearch,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [recentQRCodes, setRecentQRCodes] = React.useState<RecentQRCodeNavItem[]>([])
  const [isLoadingRecentQRCodes, setIsLoadingRecentQRCodes] = React.useState(true)

  React.useEffect(() => {
    let ignore = false

    async function loadRecentQRCodes() {
      try {
        setIsLoadingRecentQRCodes(true)
        const response = await fetch("/api/qr?limit=5")
        if (!response.ok) {
          throw new Error("Failed to load recent QR codes")
        }

        const items = await response.json() as RecentQRCodeNavItem[]
        if (!ignore) {
          setRecentQRCodes(items)
        }
      } catch (error) {
        console.error("Failed to load recent QR codes:", error)
        if (!ignore) {
          setRecentQRCodes([])
        }
      } finally {
        if (!ignore) {
          setIsLoadingRecentQRCodes(false)
        }
      }
    }

    void loadRecentQRCodes()

    return () => {
      ignore = true
    }
  }, [])

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
      {...props}
    >
      <SidebarHeader className="border-b border-sidebar-border px-3 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="h-10 rounded-xl !p-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Link href="/">
                <Logo className="!size-6 shrink-0" />
                <TypingMorph
                  initialText="tqrco.de"
                  ops={[
                    { type: "move", to: 1, delay: 50 },
                    { type: "insert", chars: "he ", speed: 100 },
                    { type: "move", to: 6, delay: 100 },
                    { type: "insert", chars: " ", speed: 100 },
                    { type: "move", to: 10, delay: 100 },
                    { type: "delete", count: 1, speed: 50 },
                    { type: "move", to: 11, delay: 100 },
                    { type: "insert", chars: " co.", speed: 100 },
                  ]}
                  className="text-[1.05rem] font-brand font-semibold tracking-[-0.04em]"
                  hideCursor
                />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="gap-0 overflow-x-hidden">
        <NavMain items={data.navMain} />
        <NavDocuments items={recentQRCodes} loading={isLoadingRecentQRCodes} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border px-3 py-2">
        <NavUser/>
      </SidebarFooter>
    </Sidebar>
  )
}
