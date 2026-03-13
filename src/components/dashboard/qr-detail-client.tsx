"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Globe, Link2, MapPin, QrCode, Save, ScanLine } from "lucide-react";
import { toast } from "sonner";

import { LatestScansList } from "@/components/dashboard/latest-scans-list";
import { ScanActivityChart } from "@/components/dashboard/scan-activity-chart";
import { TopLocationsList } from "@/components/dashboard/top-locations-list";
import QrPreview from "@/components/qr-preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { buildPublicQrUrl } from "@/lib/qr-url";
import type { CustomDomain, DailyScanCount, LatestScan, QR, QRData, TopLocation } from "@/lib/types";
import { formatDate, serialize } from "@/lib/utils";

const QR_TYPE_OPTIONS: Array<{ value: QRData["type"]; label: string }> = [
  { value: "url", label: "Website" },
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "sms", label: "SMS" },
  { value: "wifi", label: "WiFi" },
  { value: "file", label: "File" },
];

function createEmptyData(type: QRData["type"], current: QRData): QRData {
  const meta = {
    name: current.name ?? null,
    description: current.description ?? null,
  };

  switch (type) {
    case "url":
      return { type, url: "", ...meta };
    case "text":
      return { type, text: "", ...meta };
    case "email":
      return { type, to: "", subject: "", body: "", ...meta };
    case "phone":
      return { type, number: "", ...meta };
    case "sms":
      return { type, number: "", message: "", ...meta };
    case "wifi":
      return { type, ssid: "", authenticationType: "WPA", password: "", hidden: false, ...meta };
    case "file":
      return { type, key: "", ...meta };
  }
}

function typeLabel(type: QRData["type"]) {
  return QR_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}

interface QRDetailClientProps {
  initialQR: QR
  dailyScanCounts: DailyScanCount[]
  latestScans: LatestScan[]
  topLocations: TopLocation[]
}

export function QRDetailClient({
  initialQR,
  dailyScanCounts,
  latestScans,
  topLocations,
}: QRDetailClientProps) {
  const [qr, setQr] = useState(initialQR);
  const [draftData, setDraftData] = useState<QRData>(initialQR.data);
  const [customDomainId, setCustomDomainId] = useState<string | null>(initialQR.customDomainId ?? null);
  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [domainsLoading, setDomainsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadDomains() {
      try {
        setDomainsLoading(true);
        const response = await fetch("/api/dashboard/domains");
        if (!response.ok) {
          throw new Error("Failed to load domains");
        }

        const payload = await response.json() as { domains?: CustomDomain[] };
        if (!ignore) {
          setDomains((payload.domains ?? []).filter((domain) => domain.status === "ready"));
        }
      } catch (error) {
        console.error("Failed to load domains:", error);
        if (!ignore) {
          toast.error("Failed to load custom domains");
        }
      } finally {
        if (!ignore) {
          setDomainsLoading(false);
        }
      }
    }

    void loadDomains();

    return () => {
      ignore = true;
    };
  }, []);

  const resolvedHostname = useMemo(() => {
    return domains.find((domain) => domain.id === customDomainId)?.hostname ?? qr.customHostname ?? null;
  }, [customDomainId, domains, qr.customHostname]);

  const publicUrl = useMemo(() => {
    return buildPublicQrUrl(qr.code, resolvedHostname);
  }, [qr.code, resolvedHostname]);

  async function handleSave() {
    try {
      setIsSaving(true);
      const response = await fetch(`/api/qr/${qr.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: draftData,
          customDomainId,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error || "Failed to save QR code");
      }

      const updated = await response.json() as QR;
      setQr(updated);
      setDraftData(updated.data);
      setCustomDomainId(updated.customDomainId ?? null);
      toast.success("QR code updated");
    } catch (error) {
      console.error("Failed to update QR code:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update QR code");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      <section className="rounded-[28px] border border-border/70 bg-[linear-gradient(135deg,rgba(16,185,129,0.08),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">QR Workspace</p>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                {draftData.name?.trim() || qr.code}
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                Edit the QR payload, update its public domain, and review scan performance for this specific code.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/dashboard/qr-codes">Back to QR library</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={publicUrl} target="_blank" rel="noreferrer">
                Open public link
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/70">
          <CardHeader className="gap-2">
            <CardDescription>QR code</CardDescription>
            <CardTitle className="text-xl">{qr.code}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{typeLabel(draftData.type)}</CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader className="gap-2">
            <CardDescription>Total scans</CardDescription>
            <CardTitle className="text-xl">{qr.totalScans}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {qr.lastScanned ? `Last scan ${formatDate(qr.lastScanned)}` : "No scans recorded yet"}
          </CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader className="gap-2">
            <CardDescription>Public URL</CardDescription>
            <CardTitle className="truncate text-base font-semibold">{publicUrl}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {resolvedHostname ? "Custom domain active" : "Using default tqrco domain"}
          </CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader className="gap-2">
            <CardDescription>Created</CardDescription>
            <CardTitle className="text-xl">{formatDate(qr.createdAt)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            ID: <span className="font-mono">{qr.id}</span>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>Edit QR code</CardTitle>
            <CardDescription>
              Change the destination or payload without changing the public code itself.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="qr-name">Name</Label>
                <Input
                  id="qr-name"
                  value={draftData.name ?? ""}
                  onChange={(event) => {
                    const nextName = event.target.value || null;
                    setDraftData((current) => ({ ...current, name: nextName }));
                  }}
                  placeholder="Campaign landing page"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="qr-domain">Public domain</Label>
                <Select
                  value={customDomainId ?? "default"}
                  onValueChange={(value) => setCustomDomainId(value === "default" ? null : value)}
                  disabled={domainsLoading}
                >
                  <SelectTrigger id="qr-domain">
                    <SelectValue placeholder={domainsLoading ? "Loading domains..." : "Use default domain"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Use default domain</SelectItem>
                    {domains.map((domain) => (
                      <SelectItem key={domain.id} value={domain.id}>
                        {domain.hostname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="qr-description">Description</Label>
              <Textarea
                id="qr-description"
                value={draftData.description ?? ""}
                onChange={(event) => {
                  const nextDescription = event.target.value || null;
                  setDraftData((current) => ({ ...current, description: nextDescription }));
                }}
                placeholder="Context for the team using this QR code"
                rows={3}
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="qr-type">Content type</Label>
                <Select
                  value={draftData.type}
                  onValueChange={(value) => setDraftData((current) => createEmptyData(value as QRData["type"], current))}
                >
                  <SelectTrigger id="qr-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QR_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="qr-public-url">Public URL</Label>
                <Input id="qr-public-url" readOnly value={publicUrl} />
              </div>
            </div>

            {draftData.type === "url" && (
              <div className="space-y-2">
                <Label htmlFor="qr-url">Website URL</Label>
                <Input
                  id="qr-url"
                  type="url"
                  value={draftData.url}
                  onChange={(event) => setDraftData({ ...draftData, url: event.target.value })}
                  placeholder="https://example.com"
                />
              </div>
            )}

            {draftData.type === "text" && (
              <div className="space-y-2">
                <Label htmlFor="qr-text">Text content</Label>
                <Textarea
                  id="qr-text"
                  value={draftData.text}
                  onChange={(event) => setDraftData({ ...draftData, text: event.target.value })}
                  placeholder="Write the text encoded in this QR code"
                  rows={4}
                />
              </div>
            )}

            {draftData.type === "email" && (
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="qr-email-to">Recipient</Label>
                  <Input
                    id="qr-email-to"
                    type="email"
                    value={draftData.to}
                    onChange={(event) => setDraftData({ ...draftData, to: event.target.value })}
                    placeholder="team@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qr-email-subject">Subject</Label>
                  <Input
                    id="qr-email-subject"
                    value={draftData.subject}
                    onChange={(event) => setDraftData({ ...draftData, subject: event.target.value })}
                    placeholder="Campaign reply"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="qr-email-body">Body</Label>
                  <Textarea
                    id="qr-email-body"
                    value={draftData.body}
                    onChange={(event) => setDraftData({ ...draftData, body: event.target.value })}
                    rows={4}
                  />
                </div>
              </div>
            )}

            {draftData.type === "phone" && (
              <div className="space-y-2">
                <Label htmlFor="qr-phone">Phone number</Label>
                <PhoneInput
                  id="qr-phone"
                  value={draftData.number}
                  onChange={(value) => setDraftData({ ...draftData, number: value })}
                  defaultCountry="US"
                  placeholder="Enter a phone number"
                />
              </div>
            )}

            {draftData.type === "sms" && (
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="qr-sms-number">Phone number</Label>
                  <PhoneInput
                    id="qr-sms-number"
                    value={draftData.number}
                    onChange={(value) => setDraftData({ ...draftData, number: value })}
                    defaultCountry="US"
                    placeholder="Enter a phone number"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="qr-sms-message">Message</Label>
                  <Textarea
                    id="qr-sms-message"
                    value={draftData.message}
                    onChange={(event) => setDraftData({ ...draftData, message: event.target.value })}
                    rows={4}
                  />
                </div>
              </div>
            )}

            {draftData.type === "wifi" && (
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="qr-wifi-ssid">SSID</Label>
                  <Input
                    id="qr-wifi-ssid"
                    value={draftData.ssid}
                    onChange={(event) => setDraftData({ ...draftData, ssid: event.target.value })}
                    placeholder="Office WiFi"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qr-wifi-auth">Encryption</Label>
                  <Select
                    value={draftData.authenticationType}
                    onValueChange={(value) => setDraftData({ ...draftData, authenticationType: value })}
                  >
                    <SelectTrigger id="qr-wifi-auth">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WPA">WPA/WPA2</SelectItem>
                      <SelectItem value="WEP">WEP</SelectItem>
                      <SelectItem value="nopass">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {draftData.authenticationType !== "nopass" && (
                  <div className="space-y-2">
                    <Label htmlFor="qr-wifi-password">Password</Label>
                    <Input
                      id="qr-wifi-password"
                      type="password"
                      value={draftData.password ?? ""}
                      onChange={(event) => setDraftData({ ...draftData, password: event.target.value })}
                      placeholder="Network password"
                    />
                  </div>
                )}

                <div className="flex items-center gap-3 rounded-2xl border bg-muted/30 px-4 py-3 md:col-span-2">
                  <Checkbox
                    id="qr-wifi-hidden"
                    checked={Boolean(draftData.hidden)}
                    onCheckedChange={(checked) => setDraftData({ ...draftData, hidden: Boolean(checked) })}
                  />
                  <Label htmlFor="qr-wifi-hidden" className="cursor-pointer">
                    Hidden network
                  </Label>
                </div>
              </div>
            )}

            {draftData.type === "file" && (
              <div className="space-y-2">
                <Label htmlFor="qr-file-key">File key</Label>
                <Input
                  id="qr-file-key"
                  value={draftData.key}
                  onChange={(event) => setDraftData({ ...draftData, key: event.target.value })}
                  placeholder="uploads/brochure.pdf"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>Live preview</CardTitle>
              <CardDescription>Preview uses the current draft payload.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-[28px] border border-border/70 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_52%),#ffffff] p-4">
                <QrPreview data={serialize(draftData)} errorLevel="M" className="mx-auto" />
              </div>

              <div className="space-y-3 rounded-2xl border bg-muted/30 p-4 text-sm">
                <div className="flex items-start gap-3">
                  <Link2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Destination</p>
                    <p className="break-all text-muted-foreground">{serialize(draftData)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Globe className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Public URL</p>
                    <p className="break-all text-muted-foreground">{publicUrl}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>Analytics snapshot</CardTitle>
              <CardDescription>What this QR is doing right now.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-start gap-3 rounded-2xl border bg-muted/30 p-4">
                <ScanLine className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{qr.totalScans} total scans</p>
                  <p className="text-muted-foreground">
                    {qr.lastScanned ? `Most recent activity ${formatDate(qr.lastScanned)}.` : "This code has not been scanned yet."}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border bg-muted/30 p-4">
                <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{topLocations[0]?.location || "No location data yet"}</p>
                  <p className="text-muted-foreground">
                    {topLocations[0] ? `${topLocations[0].count} scans from the top location.` : "Location analytics will appear after the first tracked scans."}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border bg-muted/30 p-4">
                <QrCode className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{latestScans.length} recent events loaded</p>
                  <p className="text-muted-foreground">
                    Drill into the scan chart and feed below to inspect timing and geography.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ScanActivityChart data={dailyScanCounts} />

      <div className="grid gap-6 lg:grid-cols-2">
        <TopLocationsList locations={topLocations} />
        <LatestScansList scans={latestScans} />
      </div>
    </div>
  );
}
