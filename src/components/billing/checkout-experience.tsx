"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { BillingCheckoutPanel, type CheckoutFormState } from "@/components/billing/checkout-panel";
import { Button } from "@/components/ui/button";
import type { BillingTier } from "@/lib/billing-definitions";

type PaidTier = Exclude<BillingTier, "free">;

type CheckoutPlanCatalog = Record<PaidTier, {
  amount: number | null;
  currency: string;
  interval: string;
  label: string;
  features: string[];
}>;

function formatPrice(amount: number | null, currency: string) {
  if (amount === null) {
    return "Custom";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

export function CheckoutExperience({
  currentTier,
  initialTier,
  customerEmail,
  plans,
}: {
  currentTier: BillingTier;
  initialTier: PaidTier;
  customerEmail: string | null;
  plans: CheckoutPlanCatalog;
}) {
  const [selectedTier, setSelectedTier] = useState<PaidTier>(initialTier);
  const [checkoutState, setCheckoutState] = useState<CheckoutFormState>({
    alreadyOnPlan: currentTier === initialTier,
    loading: false,
    ready: false,
    submitting: false,
    error: null,
  });

  const selectedPlan = useMemo(() => plans[selectedTier], [plans, selectedTier]);
  const dueToday = formatPrice(selectedPlan.amount, selectedPlan.currency);
  const tierLabel = selectedTier === "creator" ? "Creator plan" : "Growth plan";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-[1100px] flex-col px-5 py-6 md:px-8 lg:px-10">
        <div className="mb-6 flex items-center gap-2 text-sm">
          <Link
            href="/dashboard/billing"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground"
            aria-label="Back to billing"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="text-[22px] font-semibold tracking-tight">Configure your plan</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <section className="space-y-6">
            <div className="space-y-3">
              <p className="text-[12px] font-medium text-foreground">Plan details</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {(["creator", "growth"] as PaidTier[]).map((tier) => {
                  const plan = plans[tier];
                  const isActive = tier === selectedTier;

                  return (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setSelectedTier(tier)}
                      className={`rounded-lg border px-4 py-3 text-left transition ${
                        isActive
                          ? "border-primary bg-card shadow-sm"
                          : "border-border bg-card hover:border-foreground/20 hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{plan.label}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatPrice(plan.amount, plan.currency)} / {plan.interval}
                          </p>
                        </div>
                        {tier === "growth" ? (
                          <span className="rounded-full bg-primary px-2 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-primary-foreground">
                            Best
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>

            </div>

            <div className="space-y-3">
              <p className="text-[12px] font-medium text-foreground">Contact information</p>
              <div className="rounded-lg border border-border bg-card px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Email</p>
                <p className="mt-1 text-sm text-foreground">{customerEmail ?? "No email available"}</p>
              </div>
            </div>

            <BillingCheckoutPanel
              currentTier={currentTier}
              selectedTier={selectedTier}
              customerEmail={customerEmail}
              onStateChange={setCheckoutState}
            />
          </section>

          <aside className="lg:sticky lg:top-8">
            <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <h2 className="text-[28px] font-semibold tracking-tight text-foreground">{tierLabel}</h2>

              <div className="mt-6 space-y-3 text-sm">
                <div className="flex items-center justify-between text-foreground">
                  <span>1x {selectedTier} subscription</span>
                  <span>{dueToday}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Estimated tax</span>
                  <span>$0.00</span>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex items-center justify-between text-[15px] font-semibold text-foreground">
                    <span>Due today</span>
                    <span>{dueToday}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-lg bg-primary/12 px-4 py-3 text-sm text-foreground">
                {selectedTier === "growth" ? "Full access unlocked immediately after payment." : "Creator access unlocked immediately after payment."}
              </div>

              <Button
                type="submit"
                form="checkout-payment-form"
                disabled={checkoutState.alreadyOnPlan || checkoutState.loading || !checkoutState.ready || checkoutState.submitting}
                className="mt-5 h-12 w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
              >
                {checkoutState.alreadyOnPlan
                  ? `Already on ${selectedPlan.label}`
                  : checkoutState.submitting
                    ? "Processing"
                  : "Subscribe"}
              </Button>

              <p className="mt-5 text-[11px] leading-5 text-muted-foreground">
                Billed monthly. Cancel anytime. By subscribing, you authorize recurring charges for the selected plan.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
