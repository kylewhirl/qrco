"use client";

import type React from "react"
import { redirect } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import QrBar from "@/components/qr-bar"
import { useUser } from "@stackframe/stack"


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check authentication
  const session = useUser()
  if (!session) {
    redirect("/login")
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <QrBar/>
      <AppSidebar variant="inset" />
      <SidebarInset className="md:h-[calc(100vh-1rem)] h-[100dvh] ">

          <SiteHeader />

        <div
          className="overflow-y-auto overscroll-contain"
          style={{
            height: 'calc(100vh - (var(--header-height) + 0.5rem))'
          }}
        >
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col">
              <main className="">{children}</main>
            </div>
          </div>
        </div>
        
      </SidebarInset>
    </SidebarProvider>
  )
}
