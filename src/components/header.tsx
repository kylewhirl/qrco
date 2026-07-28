"use client";

import Logo from "@/assets/logo";
import { TypingMorph } from "./ui/typing-morph";
import Link from "next/link";
import { useEffect, useState } from "react";
import { UserButton, useUser } from "@stackframe/stack";
import { ThemeToggle } from "@/components/ui/theme-toggle";

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
          <Link href="#products" className="brand-nav-link">Products</Link>
          <Link href="#solutions" className="brand-nav-link">Solutions</Link>
          <Link href="/retail-2d" className="brand-nav-link">Retail 2D</Link>
          <Link href="/pricing" className="brand-nav-link">Pricing</Link>
          <Link href="https://docs.tqrco.de" className="brand-nav-link">Resources</Link>
        </nav>

        <div className="ml-auto flex items-center gap-3 text-sm font-semibold">
          <ThemeToggle />
          {isHydrated ? <HeaderActions /> : (
            <>
              <Link href="/login" className="brand-nav-link hidden sm:inline-flex">Log in</Link>
              <Link href="/sign-up" className="brand-header-cta">Create a QR code</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
