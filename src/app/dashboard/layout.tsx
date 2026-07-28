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
      className="dashboard-shell bg-[var(--brand-paper)]"
      style={
        {
          "--sidebar-width": "15.25rem",
          "--header-height": "2.625rem",
        } as React.CSSProperties
      }
    >
      <QrBar/>
      <AppSidebar variant="sidebar" />
      <SidebarInset className="h-[100dvh] min-w-0 overflow-hidden bg-[var(--brand-paper)]">

          <SiteHeader />

        <div
          className="min-h-0 overflow-y-auto overscroll-contain"
          style={{
            height: "calc(100dvh - var(--header-height))"
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
