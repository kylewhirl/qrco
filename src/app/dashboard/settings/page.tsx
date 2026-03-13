import Link from "next/link";
import { ShieldCheck, KeyRound, DatabaseZap, ArrowUpRight, ScanLine, Route } from "lucide-react";
import { ApiKeyManager } from "@/components/dashboard/api-key-manager";
import { CustomDomainsManager } from "@/components/dashboard/custom-domains-manager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const integrationSteps = [
  "Use a bearer API key generated below.",
  "Call the versioned `/api/v1/*` routes from your backend, scripts, or partner apps.",
  "Every request is scoped to the Stack user who issued the key, so the key cannot cross tenant boundaries.",
];

const developerNotes = [
  {
    title: "Versioned REST base",
    description: "The first external surface ships under `/api/v1` so the eventual `api.tqrco.de` split stays backwards-compatible.",
    icon: Route,
  },
  {
    title: "Scan analytics scope",
    description: "Summary and scan-feed endpoints only return events for QR codes owned by the issuing user.",
    icon: ScanLine,
  },
  {
    title: "Database safety",
    description: "Session traffic uses Neon auth + RLS, while API-key requests stay server-side and are scoped to the issuing user before reaching the database.",
    icon: DatabaseZap,
  },
];

export default function DashboardSettingsPage() {
  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      <section className="relative overflow-hidden rounded-[28px] border border-border/60 bg-[linear-gradient(135deg,rgba(0,0,0,0.03),transparent_35%),linear-gradient(180deg,#fff,rgba(245,247,250,0.96))] p-6 shadow-sm md:p-8">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_55%)] md:block" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.24em]">
              Control Room
            </Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Settings</h1>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
                Manage API access, account security, and the integration details that turn tqrco into a programmable QR platform.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-background/80 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Auth</p>
              <p className="mt-2 text-lg font-semibold">Stack + Neon</p>
              <p className="mt-1 text-sm text-muted-foreground">Session auth in-app, bearer keys for external access.</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/80 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">API</p>
              <p className="mt-2 text-lg font-semibold">`/api/v1`</p>
              <p className="mt-1 text-sm text-muted-foreground">Ready for scripts, internal tools, and future SDK work.</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/80 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Security</p>
              <p className="mt-2 text-lg font-semibold">User-scoped</p>
              <p className="mt-1 text-sm text-muted-foreground">Every QR and scan query is filtered to the issuing user.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_380px]">
        <div className="space-y-6">
          <CustomDomainsManager />
          <ApiKeyManager />

          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>Developer rollout</CardTitle>
              <CardDescription>
                The fastest secure production path is to keep the API inside this app for now, then move the same contract behind a dedicated API host later.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                {integrationSteps.map((step, index) => (
                  <div key={step} className="rounded-2xl border bg-muted/30 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Step {index + 1}</p>
                    <p className="mt-2 text-sm leading-6">{step}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border bg-zinc-950 p-4 text-zinc-100">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">Example</p>
                <pre className="mt-3 overflow-x-auto text-xs leading-6">
{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://tqrco.de/api/v1/analytics/summary`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/70">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                <CardTitle>Account & security</CardTitle>
              </div>
              <CardDescription>
                Stack handles your core user account flows. Use account settings for identity changes and session-level security controls.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border bg-muted/30 p-4">
                <p className="text-sm font-medium">Manage account profile</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Update your authentication details and account information in the dedicated account view.
                </p>
                <Button asChild className="mt-4" variant="outline">
                  <Link href="/account">
                    Open account settings
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="rounded-2xl border bg-muted/30 p-4">
                <p className="text-sm font-medium">API key hygiene</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Treat API keys like production secrets. Generate separate keys per integration and revoke them immediately if a system or teammate no longer needs access.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader>
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4" />
                <CardTitle>Platform notes</CardTitle>
              </div>
              <CardDescription>
                Current platform behaviors worth knowing before you wire external automations against it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {developerNotes.map((note) => (
                <div key={note.title} className="rounded-2xl border bg-muted/30 p-4">
                  <div className="flex items-center gap-2">
                    <note.icon className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">{note.title}</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{note.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
