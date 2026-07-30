"use client";

import Logo from "@/assets/logo";
import { TypingMorph } from "./ui/typing-morph";
import Link from "next/link";
import { useEffect, useState } from "react";
import { UserButton, useUser } from "@stackframe/stack";
import { Menu } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

function HeaderActions() {
  const session = useUser({ or: "return-null" });

  if (session) {
    return (
      <>
        <Link href="/dashboard" className="brand-nav-link">Dashboard</Link>
        <UserButton showUserInfo={false} />
      </>
    );
  }

  return (
    <>
      <Link href="/login" className="brand-nav-link hidden sm:inline-flex">Log in</Link>
      <Link href="/sign-up" className="brand-header-cta">Create a QR code</Link>
    </>
  );
}

function MobileNavigation() {
  const session = useUser({ or: "return-null" });

  const pages = [
    { href: "/#creator", label: "Products" },
    { href: "/#solutions", label: "Solutions" },
    { href: "/retail-2d", label: "Retail 2D" },
    { href: "/pricing", label: "Pricing" },
    { href: "https://docs.tqrco.de", label: "Resources" },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[min(88vw,22rem)] gap-0 border-border bg-background p-0 shadow-2xl"
      >
        <SheetHeader className="border-b border-border px-5 py-5 text-left">
          <SheetTitle className="font-brand text-lg font-bold tracking-tight">
            Menu
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-1 flex-col px-3 py-3" aria-label="Mobile navigation">
          {pages.map((page) => (
            <SheetClose asChild key={page.href}>
              <Link
                href={page.href}
                className="rounded-md px-3 py-3.5 text-base font-semibold text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {page.label}
              </Link>
            </SheetClose>
          ))}

          <div className="mt-auto border-t border-border px-2 pt-4">
            {session ? (
              <div className="flex items-center justify-between gap-3 pb-4">
                <SheetClose asChild>
                  <Link
                    href="/dashboard"
                    className="rounded-md px-2 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Dashboard
                  </Link>
                </SheetClose>
                <UserButton showUserInfo={false} />
              </div>
            ) : (
              <SheetClose asChild>
                <Link
                  href="/login"
                  className="mb-3 block rounded-md px-2 py-2 text-center text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  Log in
                </Link>
              </SheetClose>
            )}

            <SheetClose asChild>
              <Link
                href={session ? "/dashboard/create" : "/sign-up"}
                className="flex min-h-12 w-full items-center justify-center rounded-md bg-primary px-4 py-3 text-center text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Create a QR code
              </Link>
            </SheetClose>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

export default function Header() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => setIsHydrated(true), []);

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-[color-mix(in_srgb,var(--brand-paper)_84%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="The QR Code Co home">
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
            className="hidden font-brand text-base font-bold tracking-tight sm:block sm:text-lg"
          />
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 text-sm font-semibold text-muted-foreground lg:flex" aria-label="Main navigation">
          <Link href="/#creator" className="brand-nav-link">Products</Link>
          <Link href="/#solutions" className="brand-nav-link">Solutions</Link>
          <Link href="/retail-2d" className="brand-nav-link">Retail 2D</Link>
          <Link href="/pricing" className="brand-nav-link">Pricing</Link>
          <Link href="https://docs.tqrco.de" className="brand-nav-link">Resources</Link>
        </nav>

        <div className="ml-auto flex items-center gap-3 text-sm font-semibold">
          <ThemeToggle />
          <div className="hidden items-center gap-3 lg:flex">
            {isHydrated ? <HeaderActions /> : (
              <>
                <Link href="/login" className="brand-nav-link">Log in</Link>
                <Link href="/sign-up" className="brand-header-cta">Create a QR code</Link>
              </>
            )}
          </div>
          {isHydrated ? <MobileNavigation /> : (
            <div
              className="inline-flex size-10 items-center justify-center rounded-md border border-border bg-background lg:hidden"
              aria-hidden="true"
            >
              <Menu className="size-5" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
