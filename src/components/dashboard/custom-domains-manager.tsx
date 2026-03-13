"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Globe, RefreshCw, Trash2 } from "lucide-react";
import type { CustomDomain } from "@/lib/types";
import { buildPublicQrUrl } from "@/lib/qr-url";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export function CustomDomainsManager() {
  const searchParams = useSearchParams();
  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [hostname, setHostname] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    void loadDomains();
  }, []);

  useEffect(() => {
    if (searchParams.get("domainConnect") !== "done") {
      return;
    }

    toast.success("Returned from Cloudflare. Refreshing domain status...");
    void loadDomains();
    const timer = window.setTimeout(() => {
      void loadDomains();
    }, 3000);
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.delete("domainConnect");
    nextUrl.searchParams.delete("domainId");
    window.history.replaceState({}, "", nextUrl.toString());

    return () => window.clearTimeout(timer);
  }, [searchParams]);

  async function loadDomains() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/dashboard/domains");
      if (!response.ok) {
        throw new Error("Failed to load domains");
      }

      const data = await response.json() as { domains?: CustomDomain[] };
      setDomains(data.domains ?? []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load custom domains");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreate() {
    if (!hostname.trim()) {
      toast.error("Hostname is required");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/dashboard/domains", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ hostname }),
      });

      const data = await response.json() as { domain?: CustomDomain, error?: string };
      if (!response.ok || !data.domain) {
        throw new Error(data.error || "Failed to add custom domain");
      }

      setHostname("");
      setDomains((current) => [data.domain!, ...current]);
      toast.success(
        data.domain.status === "ready"
          ? "Domain added"
          : data.domain.status === "pending_configuration"
            ? "Domain added, finish DNS configuration"
            : "Domain added, finish DNS verification",
      );
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to add custom domain");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleVerify(id: string) {
    setBusyId(id);
    try {
      const response = await fetch(`/api/dashboard/domains/${id}/verify`, {
        method: "POST",
      });

      const data = await response.json() as { domain?: CustomDomain, error?: string };
      if (!response.ok || !data.domain) {
        throw new Error(data.error || "Failed to verify custom domain");
      }

      setDomains((current) => current.map((domain) => (domain.id === id ? data.domain! : domain)));
      toast.success(
        data.domain.status === "ready"
          ? "Domain is ready"
          : data.domain.status === "pending_configuration"
            ? "Ownership verified, DNS configuration still required"
            : "Verification still pending",
      );
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to verify custom domain");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    try {
      const response = await fetch(`/api/dashboard/domains/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json() as { error?: string };
        throw new Error(data.error || "Failed to delete custom domain");
      }

      setDomains((current) => current.filter((domain) => domain.id !== id));
      toast.success("Domain removed");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to delete custom domain");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card id="domains" className="scroll-mt-24">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <CardTitle>Domains</CardTitle>
        </div>
        <CardDescription>
          Connect a custom hostname for QR redirects only. Your site and dashboard stay on the primary tqrco hosts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="space-y-2">
            <Label htmlFor="custom-domain-hostname">Hostname</Label>
            <Input
              id="custom-domain-hostname"
              placeholder="qr.example.com"
              value={hostname}
              onChange={(event) => setHostname(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Apex domains are supported only if that hostname is dedicated to QR links. Existing sites should use a subdomain.
            </p>
          </div>
          <div className="flex items-end">
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? "Adding..." : "Add domain"}
            </Button>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Connected domains</h3>
            {isLoading ? <span className="text-sm text-muted-foreground">Loading...</span> : null}
          </div>

          {domains.length === 0 && !isLoading ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No custom domains yet.
            </div>
          ) : null}

          {domains.map((domain) => (
            <div key={domain.id} className="rounded-lg border p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{domain.hostname}</span>
                    <Badge variant={domain.status === "ready" ? "default" : "secondary"}>
                      {domain.status === "ready"
                        ? "Ready"
                        : domain.status === "pending_configuration"
                          ? "Needs DNS setup"
                          : domain.status === "pending_verification"
                            ? "Needs verification"
                            : domain.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    QR links will look like {buildPublicQrUrl("abc123", domain.hostname)}
                  </p>
                  {domain.verification?.length ? (
                    <div className="rounded-lg bg-muted/50 p-3 text-xs">
                      <p className="font-medium">Verification records</p>
                      <div className="mt-2 space-y-2">
                        {domain.verification.map((record, index) => (
                          <div key={`${domain.id}-${index}`} className="grid gap-1 md:grid-cols-3">
                            <span>{record.type || "record"}</span>
                            <span className="font-mono">{record.domain || domain.hostname}</span>
                            <span className="font-mono break-all">{record.value || record.reason || "-"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {domain.configuration?.misconfigured ? (
                    <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">
                      <p className="font-medium">DNS configuration required</p>
                      <p className="mt-1 text-amber-900">
                        Vercel recognizes the domain but it is not pointed correctly yet.
                      </p>
                      {domain.configuration.recommendedIPv4.length ? (
                        <div className="mt-3 space-y-2">
                          <p className="font-medium">Set these A records</p>
                          {domain.configuration.recommendedIPv4.map((record, index) => (
                            <div key={`${domain.id}-a-${index}`} className="grid gap-1 md:grid-cols-3">
                              <span>A</span>
                              <span className="font-mono">{domain.hostname}</span>
                              <span className="font-mono break-all">{Array.isArray(record.value) ? record.value.join(", ") : record.value}</span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                      {domain.configuration.recommendedCNAME.length ? (
                        <div className="mt-3 space-y-2">
                          <p className="font-medium">Set these CNAME records</p>
                          {domain.configuration.recommendedCNAME.map((record, index) => (
                            <div key={`${domain.id}-cname-${index}`} className="grid gap-1 md:grid-cols-3">
                              <span>CNAME</span>
                              <span className="font-mono">{domain.hostname}</span>
                              <span className="font-mono break-all">{typeof record.value === "string" ? record.value : JSON.stringify(record.value)}</span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                      {domain.domainConnect?.provider === "cloudflare" ? (
                        <div className="mt-3 rounded-lg border border-amber-200 bg-white/70 p-3">
                          <p className="font-medium">One-click setup</p>
                          <p className="mt-1 text-amber-900">
                            Cloudflare was detected for this zone. Domain Connect onboarding is being prepared, so the one-click button is hidden for now.
                          </p>
                          {domain.domainConnect.reason ? (
                            <p className="mt-2 text-[11px] text-amber-900">
                              {domain.domainConnect.reason}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={busyId === domain.id}
                    onClick={() => handleVerify(domain.id)}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {busyId === domain.id ? "Checking..." : "Refresh status"}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={busyId === domain.id}
                    onClick={() => handleDelete(domain.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
