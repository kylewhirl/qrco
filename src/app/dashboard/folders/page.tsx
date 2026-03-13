import Link from "next/link";
import { ArrowUpRight, FolderKanban, FolderOpenDot, RadioTower, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllQRCodes } from "@/lib/qr-service";
import type { QR } from "@/lib/types";
import { buildPublicQrUrl } from "@/lib/qr-url";
import { formatDate } from "@/lib/utils";

type SmartFolder = {
  title: string
  description: string
  icon: typeof FolderKanban
  items: QR[]
}

function sortByCreated(qrCodes: QR[]) {
  return [...qrCodes].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

function sortByScans(qrCodes: QR[]) {
  return [...qrCodes].sort((a, b) => b.totalScans - a.totalScans);
}

export default async function DashboardFoldersPage() {
  const qrCodes = await getAllQRCodes();
  const now = Date.now();
  const sevenDays = 1000 * 60 * 60 * 24 * 7;

  const folders: SmartFolder[] = [
    {
      title: "Recently created",
      description: "New QR codes created in the last 7 days.",
      icon: Sparkles,
      items: sortByCreated(qrCodes.filter((qr) => now - +new Date(qr.createdAt) <= sevenDays)).slice(0, 8),
    },
    {
      title: "Top performers",
      description: "QR codes getting the most scan volume.",
      icon: RadioTower,
      items: sortByScans(qrCodes.filter((qr) => qr.totalScans > 0)).slice(0, 8),
    },
    {
      title: "Needs attention",
      description: "Codes with no scans yet.",
      icon: FolderOpenDot,
      items: sortByCreated(qrCodes.filter((qr) => qr.totalScans === 0)).slice(0, 8),
    },
  ];

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      <section className="rounded-[28px] border border-border/70 bg-[linear-gradient(135deg,rgba(250,204,21,0.10),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] p-6 shadow-sm md:p-8">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Smart Collections</p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Folders</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
            These folders are generated from live QR performance and creation activity so you can jump into the right set of codes without manual tagging.
          </p>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        {folders.map((folder) => (
          <Card key={folder.title} className="border-border/70">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border bg-muted/40">
                  <folder.icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>{folder.title}</CardTitle>
                  <CardDescription>{folder.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {folder.items.length === 0 ? (
                <div className="rounded-2xl border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
                  Nothing in this folder yet.
                </div>
              ) : (
                folder.items.map((qr) => (
                  <Link
                    key={qr.id}
                    href={`/dashboard/${qr.id}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border bg-muted/20 p-3 transition hover:bg-muted/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{qr.data.name?.trim() || qr.code}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {buildPublicQrUrl(qr.code, qr.customHostname ?? null)}
                      </p>
                    </div>
                    <Badge variant="outline">{qr.totalScans} scans</Badge>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>All folder-ready QR codes</CardTitle>
          <CardDescription>
            Every QR code is available here with its most useful grouping signals.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {qrCodes.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-muted/20 p-6 text-sm text-muted-foreground">
              No QR codes yet. Create one first and it will appear in the relevant smart folders automatically.
            </div>
          ) : (
            sortByCreated(qrCodes).map((qr) => {
              const tags = [
                qr.totalScans > 0 ? "Active" : "New",
                now - +new Date(qr.createdAt) <= sevenDays ? "Recent" : null,
                qr.totalScans >= 10 ? "Top performer" : null,
              ].filter(Boolean) as string[];

              return (
                <div
                  key={qr.id}
                  className="flex flex-col gap-4 rounded-2xl border p-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{qr.data.name?.trim() || qr.code}</p>
                      {tags.map((tag) => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {buildPublicQrUrl(qr.code, qr.customHostname ?? null)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Created {formatDate(qr.createdAt)}{qr.lastScanned ? ` · Last scanned ${formatDate(qr.lastScanned)}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl border bg-muted/20 px-4 py-3 text-sm">
                      <span className="text-muted-foreground">Scans</span>
                      <p className="text-lg font-semibold">{qr.totalScans}</p>
                    </div>
                    <Link
                      href={`/dashboard/${qr.id}`}
                      className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition hover:bg-accent"
                    >
                      Open
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
