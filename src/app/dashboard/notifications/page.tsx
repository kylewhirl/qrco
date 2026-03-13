import Link from "next/link";
import { redirect } from "next/navigation";
import { BellRing, CreditCard, ShieldAlert, UserRoundCheck } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { stackServerApp } from "@/stack";

export default async function DashboardNotificationsPage() {
  const user = await stackServerApp.getUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      <section className="rounded-[28px] border border-border/70 bg-[linear-gradient(135deg,rgba(34,197,94,0.10),transparent_44%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] p-6 shadow-sm md:p-8">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Inbox Signals</p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Notifications</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
            Current account alerts are routed through your primary email and key dashboard surfaces. This page shows where the important signals land today.
          </p>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/70">
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserRoundCheck className="h-4 w-4" />
              <CardTitle>Identity notices</CardTitle>
            </div>
            <CardDescription>Verification and authentication prompts.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Sent to {user.primaryEmail || "your primary email"} when verification or account recovery action is required.
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <CardTitle>Billing notices</CardTitle>
            </div>
            <CardDescription>Plan and Stripe lifecycle events.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Billing updates are tied to the workspace owner email and surfaced again in the billing dashboard view.
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              <CardTitle>Security alerts</CardTitle>
            </div>
            <CardDescription>Session and account-risk signals.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Active session changes and verification needs can be reviewed directly from the custom account page.
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BellRing className="h-4 w-4" />
            <CardTitle>Action shortcuts</CardTitle>
          </div>
          <CardDescription>Jump straight to the surfaces that control each category.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Link href="/dashboard/account" className="rounded-2xl border bg-muted/30 p-4 text-sm transition hover:bg-muted/50">
            <p className="font-medium">Open account</p>
            <p className="mt-2 text-muted-foreground">Profile, password, verification, and session controls.</p>
          </Link>
          <Link href="/dashboard/billing" className="rounded-2xl border bg-muted/30 p-4 text-sm transition hover:bg-muted/50">
            <p className="font-medium">Open billing</p>
            <p className="mt-2 text-muted-foreground">Plan state, subscription metadata, and checkout actions.</p>
          </Link>
          <Link href="/dashboard/help" className="rounded-2xl border bg-muted/30 p-4 text-sm transition hover:bg-muted/50">
            <p className="font-medium">Open help</p>
            <p className="mt-2 text-muted-foreground">Support routing and triage paths for account issues.</p>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
