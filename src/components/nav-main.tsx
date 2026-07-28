"use client"

import { IconCirclePlusFilled, IconSparkles, type Icon } from "@tabler/icons-react"
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import AICreateQr from "@/components/ai-create-qr";
import { QrCode, WandSparkles } from "lucide-react";
import QrCodeCreator from "@/components/qr-code-creator";
import { cn } from "@/lib/utils";

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
  }[]
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup className="px-3 py-3">
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <SidebarMenuButton
                  tooltip="Quick Create"
                  className="h-10 min-w-8 rounded-xl border border-[var(--brand-blue)] bg-[var(--brand-blue)] px-3 font-bold !text-white shadow-[0_12px_24px_-16px_var(--brand-blue)] transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--brand-blue)]/92 hover:!text-white active:translate-y-0 active:bg-[var(--brand-blue)] active:!text-white"
                >
                  <IconCirclePlusFilled />
                  <span>Create QR Code</span>
                </SidebarMenuButton>
              </DialogTrigger>
              <DialogContent className="max-h-[calc(100dvh-1rem)] overflow-y-auto border-none bg-transparent p-0 shadow-none sm:max-h-[calc(100dvh-2rem)] sm:max-w-7xl">
                <DialogTitle className="sr-only">
                  <div className="flex flex-row items-center">
                  <QrCode className="mr-2 h-4 w-4" />
                  Create QR Code</div>
                </DialogTitle>
                <QrCodeCreator variant="hero" />
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="size-10 shrink-0 rounded-xl border border-sidebar-border bg-card text-[var(--brand-blue)] shadow-none transition-colors hover:bg-accent hover:text-[var(--brand-blue)] group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:opacity-0"
                >
                  <IconSparkles />
                  <span className="sr-only">AI Create</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[calc(100dvh-1rem)] overflow-y-auto border-none bg-transparent p-0 shadow-none sm:max-h-[calc(100dvh-2rem)] sm:max-w-6xl">
                <DialogTitle className="sr-only">
                  <div className="flex flex-row items-center">
                  <WandSparkles className="mr-2 h-4 w-4" />
                  AI Create QR Code</div>
                </DialogTitle>
                <AICreateQr />
              </DialogContent>
            </Dialog>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu className="mt-2 gap-1">
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={pathname === item.url}
                className={cn(
                  "h-9 rounded-xl px-2.5 font-semibold text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  pathname === item.url && "bg-sidebar-accent text-[var(--brand-blue)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--brand-blue)_12%,transparent)] hover:bg-sidebar-accent hover:text-[var(--brand-blue)]"
                )}
              >
                <Link href={item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
