import { redirect } from "next/navigation";
import { CalendarClock, CreditCard, ReceiptText, ShieldCheck } from "lucide-react";

import { BillingActions } from "@/components/dashboard/billing-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { stackServerApp } from "@/stack";

type StripeSubscriptionMetadata = {
  id?: string
  status?: string
  currentPeriodEnd?: number
  priceId?: string
};

function resolvePlan(subscription: StripeSubscriptionMetadata | undefined) {
  if (!subscription || subscription.status !== "active") {
    return {
      name: "Free",
      headline: "No active paid subscription",
      history: "1 month analytics history",
      api: "Community plan access",
    };
  }

  if (subscription.priceId && subscription.priceId === process.env.STRIPE_CREATOR_PRICE_ID) {
    return {
      name: "Creator",
      headline: "Active self-serve subscription",
      history: "6 month analytics history",
      api: "5k API requests per month",
    };
  }

  return {
    name: "Paid",
    headline: "Active paid subscription",
    history: "Extended analytics history",
    api: "Expanded API access",
  };
}

export default async function DashboardBillingPage() {
  const user = await stackServerApp.getUser();
  if (!user) {
    redirect("/login");
  }

  const subscription = user.serverMetadata?.stripeSubscription as StripeSubscriptionMetadata | undefined;
  const plan = resolvePlan(subscription);
  const periodEnd = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "No renewal scheduled";

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      <section className="rounded-[28px] border border-border/70 bg-[linear-gradient(135deg,rgba(14,165,233,0.10),transparent_44%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] p-6 shadow-sm md:p-8">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Commerce</p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Billing</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
            Review your current plan, subscription state, and upgrade path without leaving the dashboard.
          </p>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/70">
          <CardHeader className="gap-2">
            <CardDescription>Current plan</CardDescription>
            <CardTitle className="text-xl">{plan.name}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{plan.headline}</CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader className="gap-2">
            <CardDescription>Subscription status</CardDescription>
            <CardTitle className="text-xl capitalize">{subscription?.status || "inactive"}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {subscription?.id ? `Stripe subscription ${subscription.id}` : "No Stripe subscription attached yet"}
          </CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader className="gap-2">
            <CardDescription>Renewal</CardDescription>
            <CardTitle className="text-xl">{periodEnd}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Next billing checkpoint based on the last webhook update.</CardContent>
        </Card>
        <Card className="border-border/70">
          <CardHeader className="gap-2">
            <CardDescription>Account email</CardDescription>
            <CardTitle className="truncate text-xl">{user.primaryEmail || "Not available"}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Billing notices route to this workspace owner email.</CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
        <div className="space-y-6">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>Plan summary</CardTitle>
              <CardDescription>The billing information currently available in-app.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{plan.name}</Badge>
                <Badge variant="outline">{plan.history}</Badge>
                <Badge variant="outline">{plan.api}</Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border bg-muted/30 p-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Checkout</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Start or change a self-serve subscription using the same Stripe checkout flow as the public pricing page.
                  </p>
                </div>
                <div className="rounded-2xl border bg-muted/30 p-4">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Renewal source</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Renewal timing is based on the subscription webhook metadata stored on your user record.
                  </p>
                </div>
                <div className="rounded-2xl border bg-muted/30 p-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Ownership</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Billing remains attached to the dashboard owner account that completed Stripe checkout.
                  </p>
                </div>
              </div>

              <BillingActions hasActiveSubscription={subscription?.status === "active"} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/70">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ReceiptText className="h-4 w-4" />
                <CardTitle>What changes by plan</CardTitle>
              </div>
              <CardDescription>Current commercial differences already expressed in the product copy.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-2xl border bg-muted/30 p-4">
                <p className="font-medium">Free</p>
                <p className="mt-1 text-muted-foreground">Basic analytics, limited AI generation, and no file uploads.</p>
              </div>
              <div className="rounded-2xl border bg-muted/30 p-4">
                <p className="font-medium">Creator</p>
                <p className="mt-1 text-muted-foreground">Adds file uploads, custom domains, extended analytics history, and API access.</p>
              </div>
              <div className="rounded-2xl border bg-muted/30 p-4">
                <p className="font-medium">Business</p>
                <p className="mt-1 text-muted-foreground">Extends API limits, analytics retention, and collaboration capacity.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
