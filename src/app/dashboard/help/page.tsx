import Link from "next/link";
import { ArrowUpRight, CircleHelp, CreditCard, KeyRound, Mail, Settings2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const helpLinks = [
  {
    title: "Settings and API access",
    description: "Manage custom domains, API keys, and integration notes.",
    href: "/dashboard/settings",
    icon: Settings2,
  },
  {
    title: "Billing and subscriptions",
    description: "Review your plan and upgrade path from inside the dashboard.",
    href: "/dashboard/billing",
    icon: CreditCard,
  },
  {
    title: "Account settings",
    description: "Open your Stack account view for identity and session controls.",
    href: "/dashboard/account",
    icon: KeyRound,
  },
  {
    title: "Contact support",
    description: "Reach the team directly for product questions or account help.",
    href: "/contact",
    icon: Mail,
  },
];

export default function DashboardHelpPage() {
  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      <section className="rounded-[28px] border border-border/70 bg-[linear-gradient(135deg,rgba(244,114,182,0.10),transparent_44%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] p-6 shadow-sm md:p-8">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Support</p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Get Help</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
            Jump directly to the parts of the product that solve the most common operational issues.
          </p>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {helpLinks.map((item) => (
          <Link key={item.title} href={item.href} className="block">
            <Card className="h-full border-border/70 transition hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border bg-muted/30">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                Open
                <ArrowUpRight className="h-4 w-4" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="border-border/70">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CircleHelp className="h-4 w-4" />
            <CardTitle>Quick triage</CardTitle>
          </div>
          <CardDescription>Where to look first depending on the problem you are solving.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border bg-muted/30 p-4">
            <p className="font-medium">QR destination issue</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Open the QR directly from recent codes or search and edit it in `/dashboard/[qrId]`.
            </p>
          </div>
          <div className="rounded-2xl border bg-muted/30 p-4">
            <p className="font-medium">Custom domain problem</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Start with dashboard settings to verify ownership and current domain configuration.
            </p>
          </div>
          <div className="rounded-2xl border bg-muted/30 p-4">
            <p className="font-medium">Billing or plan change</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Use the billing page to inspect subscription state and launch checkout again if needed.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
