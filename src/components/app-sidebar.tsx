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
  IconBrush
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
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/">
                <Logo className="!size-5" />
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
                  className="text-xl font-brand font-semibold"
                  hideCursor
                />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={recentQRCodes} loading={isLoadingRecentQRCodes} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser/>
      </SidebarFooter>
    </Sidebar>
  )
}
