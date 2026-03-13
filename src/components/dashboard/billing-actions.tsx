"use client";

import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function BillingActions({ hasActiveSubscription }: { hasActiveSubscription: boolean }) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleCheckout() {
    try {
      setIsLoading(true);
      const response = await fetch("/api/checkout", { method: "POST" });
      if (response.status === 401) {
        window.location.assign("/sign-up");
        return;
      }

      const payload = await response.json() as { url?: string };
      if (payload.url) {
        window.location.assign(payload.url);
        return;
      }

      window.location.assign("/pricing");
    } catch (error) {
      console.error("Failed to start checkout:", error);
      window.location.assign("/pricing");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Button onClick={handleCheckout} disabled={isLoading}>
        {isLoading ? "Opening checkout..." : hasActiveSubscription ? "Change plan" : "Upgrade to Creator"}
      </Button>
      <Button asChild variant="outline">
        <Link href="/pricing">View pricing</Link>
      </Button>
    </div>
  );
}
