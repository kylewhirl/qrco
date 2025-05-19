"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { data as sidebarData } from "@/components/app-sidebar";
import { WandSparkles, PaintbrushVertical } from "lucide-react";
import dynamic from "next/dynamic";
import { ShineBorder } from "./magicui/shine-border";
import { Button } from "./ui/button";
import { IconArrowBack, IconSearch, IconSparkles } from "@tabler/icons-react";

interface PageItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

export default function QrBar() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"menu" | "ai">("menu");

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const pages: PageItem[] = [
    // load from sidebar data
    ...sidebarData.navMain.map((item) => ({
      name: item.title,
      href: item.url,
      icon: item.icon,
    })),
  ];

  if (!open) {
    return null;
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center backdrop-blur z-50">
      <CommandDialog open={open} onOpenChange={(val) => {
        if (!val) setMode("menu");
        setOpen(val);
      }}>
        <CommandInput readOnly={mode === "menu" ? false : true } icon={mode === "menu" ? IconSearch : IconSparkles} placeholder={mode === "menu" ? "Type a command or search..." : "Ask our AI to create a QR Code for you"}/>
        {mode === "menu" ? (
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Suggestions">
              <CommandItem onSelect={() => { setMode("ai"); }}>
                <WandSparkles className="mr-2 h-4 w-4" />
                AI Create QR Code
              </CommandItem>
              <CommandItem onSelect={() => {/* add extra suggestion actions */}}>
                <PaintbrushVertical className="mr-2 h-4 w-4" />
                QR Designer
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="Pages">
              {pages.map((page) => (
                <CommandItem
                  key={page.href}
                  onSelect={() => {
                    setOpen(false);
                    router.push(page.href);
                  }}
                >
                  <div className="flex items-center">
                    <page.icon className="mr-2 h-4 w-4" />
                    <span>{page.name}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </CommandList>
        ) : (
            <div className="p-4">
                <Button onClick={() => setMode("menu")} variant={"outline"} size={"icon"}>
                    <IconArrowBack/>
                </Button>
                <AICreateQr /> 
            </div>
        )}
        <ShineBorder shineColor={["#ffffff", "#b3c8ff", "#a6ddff"]} borderWidth={2}/>
      </CommandDialog>
        
    </div>
  );
}
const AICreateQr = dynamic(() => import("@/components/ai-create-qr"), {
  ssr: false,
  loading: () => <div className="p-4 text-center">Loading QR UI...</div>,
});