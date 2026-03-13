import { redirect } from "next/navigation";
import { Crown, KeyRound, Mail, ShieldCheck, Users, Globe2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listApiKeysForUser } from "@/lib/api-keys";
import { listCustomDomainsForUser } from "@/lib/custom-domains";
import { getDashboardMetricsForUser } from "@/lib/qr-service";
import { stackServerApp } from "@/stack";

function resolvePlan(user: { serverMetadata?: Record<string, unknown> } | null) {
  const subscription = user?.serverMetadata?.stripeSubscription as
    | { status?: string; priceId?: string }
    | undefined;

  if (!subscription || subscription.status !== "active") {
    return { name: "Free", seats: 1, status: "No paid seats" };
  }

  if (subscription.priceId && subscription.priceId === process.env.STRIPE_CREATOR_PRICE_ID) {
    return { name: "Creator", seats: 3, status: "Active subscription" };
  }

  return { name: "Paid", seats: 10, status: "Active subscription" };
}

export default async function DashboardTeamPage() {
  const user = await stackServerApp.getUser();
  if (!user) {
    redirect("/login");
  }

  const [metrics, apiKeys, domains] = await Promise.all([
    getDashboardMetricsForUser(user.id),
    listApiKeysForUser(user.id),
    listCustomDomainsForUser(user.id),
  ]);

  const plan = resolvePlan(user);
  const displayName = user.displayName || user.primaryEmail || "Workspace owner";
  const activeKeys = apiKeys.filter((key) => !key.revokedAt).length;
  const readyDomains = domains.filter((domain) => domain.status === "ready").length;

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      <section className="rounded-[28px] border border-border/70 bg-[linear-gradient(135deg,rgba(59,130,246,0.10),transparent_44%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] p-6 shadow-sm md:p-8">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Workspace</p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Team</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
            Your workspace is currently centered on a single owner account, with plan limits, API access, and domain readiness summarized here.
          </p>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/70">
          <CardHeader className="gap-2">
            <CardDescription>Plan</CardDescription>
            <CardTitle className="text-xl">{plan.name}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{plan.status}</CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader className="gap-2">
            <CardDescription>Seats in use</CardDescription>
            <CardTitle className="text-xl">1 / {plan.seats}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">The current workspace owner occupies the first seat.</CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader className="gap-2">
            <CardDescription>Active QR codes</CardDescription>
            <CardTitle className="text-xl">{metrics.activeQRCodesCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">These are the assets your team setup would need to coordinate.</CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader className="gap-2">
            <CardDescription>Ready domains</CardDescription>
            <CardTitle className="text-xl">{readyDomains}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Custom domains available for shared campaigns.</CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
        <div className="space-y-6">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>Workspace owner</CardTitle>
              <CardDescription>The account that currently controls this dashboard.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border bg-muted/30 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border bg-background">
                    <Crown className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{displayName}</p>
                    <p className="text-sm text-muted-foreground">{user.primaryEmail || "No primary email available"}</p>
                  </div>
                  <Badge variant="outline" className="ml-auto">Owner</Badge>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border bg-muted/30 p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Seats</p>
                  </div>
                  <p className="mt-3 text-2xl font-semibold">{plan.seats - 1}</p>
                  <p className="mt-1 text-sm text-muted-foreground">available for future collaborators</p>
                </div>
                <div className="rounded-2xl border bg-muted/30 p-4">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Active API keys</p>
                  </div>
                  <p className="mt-3 text-2xl font-semibold">{activeKeys}</p>
                  <p className="mt-1 text-sm text-muted-foreground">shared integration credentials in circulation</p>
                </div>
                <div className="rounded-2xl border bg-muted/30 p-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Security posture</p>
                  </div>
                  <p className="mt-3 text-2xl font-semibold">User-scoped</p>
                  <p className="mt-1 text-sm text-muted-foreground">every QR and analytics query is already tenant-bound</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>Collaboration checklist</CardTitle>
              <CardDescription>What is already ready for a larger team and what still needs product work.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-2xl border bg-muted/30 p-4">
                <p className="font-medium">Ready now</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Shared QR inventory, centralized analytics, API keys, and custom domains already operate under a single workspace owner.
                </p>
              </div>
              <div className="rounded-2xl border bg-muted/30 p-4">
                <p className="font-medium">Next collaboration layer</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Member invites and role-based permissions are not wired yet, so this page currently acts as the operational readiness view for the owner account.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/70">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <CardTitle>Owner contact</CardTitle>
              </div>
              <CardDescription>Primary identity used for workspace notifications.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-2xl border bg-muted/30 p-4 text-sm">
                <p className="font-medium">{user.primaryEmail || "No primary email configured"}</p>
                <p className="mt-2 text-muted-foreground">
                  This address receives billing notices, authentication flows, and operational account updates.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe2 className="h-4 w-4" />
                <CardTitle>Operational surfaces</CardTitle>
              </div>
              <CardDescription>Current areas your future team would inherit.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-2xl border bg-muted/30 p-4 text-sm">
                <p className="font-medium">{metrics.activeQRCodesCount} live QR codes</p>
                <p className="mt-1 text-muted-foreground">Reusable assets already in rotation.</p>
              </div>
              <div className="rounded-2xl border bg-muted/30 p-4 text-sm">
                <p className="font-medium">{readyDomains} verified custom domains</p>
                <p className="mt-1 text-muted-foreground">Brand-safe destinations available for campaigns.</p>
              </div>
              <div className="rounded-2xl border bg-muted/30 p-4 text-sm">
                <p className="font-medium">{activeKeys} active API keys</p>
                <p className="mt-1 text-muted-foreground">Automations and external systems currently connected.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
