import { redirect } from "next/navigation";
import { CheckCircle2, CreditCard, Gauge, ShieldCheck, Sparkles } from "lucide-react";

import { BillingCheckoutPanel } from "@/components/billing/checkout-panel";
import { ManageBillingButton } from "@/components/billing/manage-billing-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUserBillingState, getStripeCheckoutPlanCatalog } from "@/lib/billing";
import type { BillingTier } from "@/lib/billing-definitions";
import { stackServerApp } from "@/stack";

function formatUsage(used: number, limit: number | null) {
  if (limit === null) {
    return `${used.toLocaleString()} used`;
  }

  return `${used.toLocaleString()} / ${limit.toLocaleString()}`;
}

export default async function DashboardBillingPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await stackServerApp.getUser();
  if (!user) {
    redirect("/login");
  }

  const [billingState, planCatalog, resolvedSearchParams] = await Promise.all([
    getCurrentUserBillingState(),
    getStripeCheckoutPlanCatalog(),
    searchParams ?? Promise.resolve({} as Record<string, string | string[] | undefined>),
  ]);

  const requestedTier = typeof resolvedSearchParams.plan === "string" ? resolvedSearchParams.plan : null;
  const initialTier = requestedTier === "growth"
    ? "growth"
    : requestedTier === "creator"
      ? "creator"
      : (billingState.tier === "growth" ? "growth" : "creator");

  const planCopy = [
    { label: "Current plan", value: billingState.plan.label, icon: CreditCard },
    { label: "AI usage", value: formatUsage(billingState.usage.ai_generations.used, billingState.usage.ai_generations.limit), icon: Sparkles },
    { label: "API usage", value: billingState.plan.access.api_access ? formatUsage(billingState.usage.api_requests.used, billingState.usage.api_requests.limit) : "Locked", icon: Gauge },
    { label: "Support tier", value: billingState.plan.paid ? "Paid account" : "Self-serve free", icon: ShieldCheck },
  ];

  const checkoutPlans = {
    creator: {
      ...planCatalog.creator,
      label: "Creator",
      headline: "Uploads, custom domains, API access, and 180 days of analytics",
    },
    growth: {
      ...planCatalog.growth,
      label: "Growth",
      headline: "Full product access with unlimited API usage and full analytics retention",
    },
  };

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      <section className="dashboard-hero dashboard-hero-sky rounded-[28px] border p-6 md:p-8">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Commerce</p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Billing</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
            Subscription state now drives paywalled access across uploads, domains, API usage, AI generation, and analytics depth.
          </p>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {planCopy.map((item) => (
          <Card key={item.label} className="border-border/70">
            <CardHeader className="gap-2">
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className="flex items-center gap-2 text-xl">
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <span>{item.value}</span>
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_420px]">
        <div className="space-y-6">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>Plan summary</CardTitle>
              <CardDescription>{billingState.plan.headline}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{billingState.plan.label}</Badge>
                <Badge variant="outline">
                  {billingState.plan.limits.analyticsHistoryDays === null
                    ? "Unlimited analytics history"
                    : `${billingState.plan.limits.analyticsHistoryDays} day analytics history`}
                </Badge>
                <Badge variant="outline">
                  {billingState.plan.access.api_access
                    ? billingState.plan.limits.apiRequestsPerMonth === null
                      ? "Unlimited API"
                      : `${billingState.plan.limits.apiRequestsPerMonth.toLocaleString()} API requests/mo`
                    : "API locked"}
                </Badge>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {billingState.plan.features.map((feature) => (
                  <div key={feature} className="rounded-2xl border bg-muted/25 p-4 text-sm">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                      <span>{feature}</span>
                    </div>
                  </div>
                ))}
              </div>

              {billingState.plan.paid ? <ManageBillingButton /> : null}
            </CardContent>
          </Card>
        </div>

        <BillingCheckoutPanel
          currentTier={billingState.tier as BillingTier}
          initialTier={initialTier}
          plans={checkoutPlans}
        />
      </div>
    </div>
  );
}
