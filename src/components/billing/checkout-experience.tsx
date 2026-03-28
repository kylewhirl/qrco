"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ChevronDown, Minus, Plus } from "lucide-react";

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
    <div className="min-h-screen bg-[#1f1f1f] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 md:px-8 lg:px-10">
        <div className="mb-6 flex items-center gap-2 text-sm text-[#d7d7d7]">
          <Link
            href="/dashboard/billing"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#c7c7c7] transition hover:bg-white/6 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="text-[22px] font-semibold tracking-tight">Configure your plan</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <section className="space-y-6">
            <div className="space-y-3">
              <p className="text-[12px] font-medium text-[#d8d8d8]">Plan details</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {(["creator", "growth"] as PaidTier[]).map((tier) => {
                  const plan = plans[tier];
                  const isActive = tier === selectedTier;

                  return (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setSelectedTier(tier)}
                      className={`rounded-[18px] border px-4 py-3 text-left transition ${
                        isActive
                          ? "border-white/18 bg-[#2d2d2d] shadow-[0_10px_24px_-18px_rgba(0,0,0,0.9)]"
                          : "border-white/6 bg-[#252525] hover:border-white/12 hover:bg-[#2a2a2a]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-white">{plan.label}</p>
                          <p className="mt-1 text-xs text-[#9c9c9c]">{formatPrice(plan.amount, plan.currency)} / {plan.interval}</p>
                        </div>
                        {tier === "growth" ? (
                          <span className="rounded-full bg-[#5d4ab1] px-2 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white">
                            Best
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between rounded-[18px] border border-white/6 bg-[#252525] px-4 py-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[#8a8a8a]">Seats</p>
                  <p className="mt-1 text-sm text-white">1</p>
                </div>
                <div className="flex items-center gap-2 text-[#8f8f8f]">
                  <Minus className="h-4 w-4" />
                  <Plus className="h-4 w-4" />
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[12px] font-medium text-[#d8d8d8]">Contact information</p>
              <div className="rounded-[18px] border border-white/6 bg-[#252525] px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[#8a8a8a]">Email</p>
                <p className="mt-1 text-sm text-white">{customerEmail ?? "No email available"}</p>
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
            <div className="rounded-[28px] border border-white/8 bg-[#2a2a2a] p-5 shadow-[0_30px_80px_-48px_rgba(0,0,0,0.95)]">
              <h2 className="text-[28px] font-semibold tracking-tight text-white">{tierLabel}</h2>

              <div className="mt-6 space-y-3 text-sm">
                <div className="flex items-center justify-between text-[#d9d9d9]">
                  <span>1x {selectedTier} subscription</span>
                  <span>{dueToday}</span>
                </div>
                <div className="flex items-center justify-between text-[#9f9f9f]">
                  <span>Estimated tax</span>
                  <span>$0.00</span>
                </div>
                <div className="border-t border-white/8 pt-3">
                  <div className="flex items-center justify-between text-[15px] font-semibold text-white">
                    <span>Due today</span>
                    <span>{dueToday}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-[18px] bg-[#5d4ab1] px-4 py-3 text-sm text-white">
                {selectedTier === "growth" ? "Full access unlocked immediately after payment." : "Creator access unlocked immediately after payment."}
              </div>

              <Button
                type="submit"
                form="checkout-payment-form"
                disabled={checkoutState.alreadyOnPlan || checkoutState.loading || !checkoutState.ready || checkoutState.submitting}
                className="mt-5 h-12 w-full rounded-full bg-white text-black hover:bg-white/92 disabled:bg-white/40 disabled:text-black/60"
              >
                {checkoutState.alreadyOnPlan
                  ? `Already on ${selectedPlan.label}`
                  : checkoutState.submitting
                    ? "Processing"
                    : "Subscribe"}
              </Button>

              <p className="mt-5 text-[11px] leading-5 text-[#909090]">
                Billed monthly. Cancel anytime. By subscribing, you authorize recurring charges for the selected plan.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
