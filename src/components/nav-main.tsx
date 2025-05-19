"use client"

import { IconCirclePlusFilled, IconSparkles, type Icon } from "@tabler/icons-react"
import { useRouter } from "next/navigation";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
} from "@/components/ui/dialog";
import AICreateQr from "@/components/ai-create-qr";
import { DialogTitle } from "@radix-ui/react-dialog";
import { WandSparkles } from "lucide-react";

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
  }[]
}) {
  const router = useRouter();
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Quick Create"
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
            >
              <IconCirclePlusFilled />
              <span>Create QR Code</span>
            </SidebarMenuButton>
            <Dialog>
              <DialogTrigger asChild>
                <ShimmerButton
                  size="icon"
                  className="size-8 group-data-[collapsible=icon]:opacity-0"
                  variant="outline"
                >
                  <IconSparkles />
                  <span className="sr-only">AI Create</span>
                </ShimmerButton>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>
                  <div className="flex flex-row items-center">
                  <WandSparkles className="mr-2 h-4 w-4" />
                  AI Create QR Code</div>
                </DialogTitle>
                <AICreateQr />
              </DialogContent>
            </Dialog>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton tooltip={item.title} onClick={() => router.push(item.url)}>
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
