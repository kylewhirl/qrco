"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function ManageBillingButton() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    try {
      setIsLoading(true);
      const response = await fetch("/api/billing/portal", {
        method: "POST",
      });

      const payload = await response.json().catch(() => null) as { url?: string; error?: string } | null;
      if (!response.ok || !payload?.url) {
        throw new Error(payload?.error || "Unable to open billing portal");
      }

      window.location.assign(payload.url);
    } catch (error) {
      console.error("Failed to open billing portal:", error);
      toast.error(error instanceof Error ? error.message : "Unable to open billing portal");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button variant="outline" onClick={handleClick} disabled={isLoading}>
      <ExternalLink className="h-4 w-4" />
      {isLoading ? "Opening..." : "Manage billing"}
    </Button>
  );
}
