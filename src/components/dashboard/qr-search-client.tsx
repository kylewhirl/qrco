"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { QR } from "@/lib/types";
import { buildPublicQrUrl } from "@/lib/qr-url";
import { formatDate } from "@/lib/utils";

function typeLabel(type: QR["data"]["type"]) {
  return type === "url"
    ? "Website"
    : type === "sms"
      ? "SMS"
      : type.charAt(0).toUpperCase() + type.slice(1);
}

function searchableText(qr: QR) {
  return [
    qr.code,
    qr.data.name,
    qr.data.description,
    qr.data.type,
    qr.publicUrl,
    qr.data.type === "url" ? qr.data.url : "",
    qr.data.type === "text" ? qr.data.text : "",
    qr.data.type === "email" ? `${qr.data.to} ${qr.data.subject} ${qr.data.body}` : "",
    qr.data.type === "phone" ? qr.data.number : "",
    qr.data.type === "sms" ? `${qr.data.number} ${qr.data.message}` : "",
    qr.data.type === "wifi" ? `${qr.data.ssid} ${qr.data.authenticationType}` : "",
    qr.data.type === "file" ? qr.data.key : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function QRSearchClient({ qrCodes }: { qrCodes: QR[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return qrCodes;
    }

    return qrCodes.filter((qr) => searchableText(qr).includes(normalized));
  }, [qrCodes, query]);

  return (
    <div className="space-y-6">
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>Search your QR library</CardTitle>
          <CardDescription>
            Search by code, name, destination, phone number, email subject, WiFi SSID, or description.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search QR codes..."
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.length === 0 ? (
          <Card className="border-border/70 lg:col-span-2">
            <CardContent className="flex min-h-40 flex-col items-center justify-center gap-3 text-center">
              <p className="text-lg font-semibold">No QR codes match that search.</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Try a code fragment, campaign name, public URL, or content-specific field.
              </p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((qr) => {
            const publicUrl = qr.publicUrl || buildPublicQrUrl(qr.code, qr.customHostname ?? null);

            return (
              <Card key={qr.id} className="border-border/70">
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{qr.data.name?.trim() || qr.code}</CardTitle>
                      <CardDescription className="break-all">{publicUrl}</CardDescription>
                    </div>
                    <Badge variant="outline">{typeLabel(qr.data.type)}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border bg-muted/30 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Scans</p>
                      <p className="mt-2 text-lg font-semibold">{qr.totalScans}</p>
                    </div>
                    <div className="rounded-2xl border bg-muted/30 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Last scanned</p>
                      <p className="mt-2 font-medium">{qr.lastScanned ? formatDate(qr.lastScanned) : "Never"}</p>
                    </div>
                    <div className="rounded-2xl border bg-muted/30 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Created</p>
                      <p className="mt-2 font-medium">{formatDate(qr.createdAt)}</p>
                    </div>
                  </div>

                  {qr.data.description && (
                    <p className="rounded-2xl border bg-muted/30 p-3 text-muted-foreground">
                      {qr.data.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/dashboard/${qr.id}`}
                      className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                    >
                      Open detail
                    </Link>
                    <Link
                      href={publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition hover:bg-accent"
                    >
                      Open public link
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
