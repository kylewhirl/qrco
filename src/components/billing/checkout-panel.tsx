"use client";

import { useEffect, useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { CheckCircle2, CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { BillingTier } from "@/lib/billing-definitions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PaidTier = Exclude<BillingTier, "free">;

type PlanCatalog = Record<PaidTier, {
  amount: number | null;
  currency: string;
  interval: string;
  label: string;
  headline: string;
}>;

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

function formatPrice(amount: number | null, currency: string) {
  if (amount === null) {
    return "Custom";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function CheckoutForm({
  selectedTier,
  onSuccess,
}: {
  selectedTier: PaidTier;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const confirmed = await stripe.confirmSetup({
        elements,
        redirect: "if_required",
      });

      if (confirmed.error) {
        throw new Error(confirmed.error.message || "Payment method confirmation failed");
      }

      if (!confirmed.setupIntent?.payment_method) {
        throw new Error("Stripe did not return a reusable payment method");
      }

      const response = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tier: selectedTier,
          paymentMethodId: confirmed.setupIntent.payment_method,
        }),
      });

      const payload = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to start subscription");
      }

      toast.success("Subscription updated");
      onSuccess();
    } catch (submitError) {
      console.error("Billing submit failed:", submitError);
      const message = submitError instanceof Error ? submitError.message : "Unable to complete checkout";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="rounded-[24px] border border-border/70 bg-background/80 p-4">
        <PaymentElement />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || !stripe || !elements}>
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
        {isSubmitting ? "Processing..." : `Subscribe to ${selectedTier === "creator" ? "Creator" : "Growth"}`}
      </Button>
    </form>
  );
}

export function BillingCheckoutPanel({
  currentTier,
  initialTier,
  plans,
}: {
  currentTier: BillingTier;
  initialTier: PaidTier;
  plans: PlanCatalog;
}) {
  const [selectedTier, setSelectedTier] = useState<PaidTier>(initialTier);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingSecret, setLoadingSecret] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  const alreadyOnPlan = currentTier === selectedTier;

  const selectedPlan = useMemo(() => plans[selectedTier], [plans, selectedTier]);

  useEffect(() => {
    let ignore = false;

    async function loadSetupIntent() {
      if (!publishableKey) {
        setSetupError("Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
        setClientSecret(null);
        return;
      }

      if (alreadyOnPlan) {
        setSetupError(null);
        setClientSecret(null);
        return;
      }

      try {
        setLoadingSecret(true);
        setSetupError(null);
        const response = await fetch("/api/billing/setup-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ tier: selectedTier }),
        });

        const payload = await response.json().catch(() => null) as { clientSecret?: string; error?: string } | null;
        if (!response.ok || !payload?.clientSecret) {
          throw new Error(payload?.error || "Unable to prepare checkout");
        }

        if (!ignore) {
          setClientSecret(payload.clientSecret);
        }
      } catch (error) {
        console.error("Failed to prepare checkout:", error);
        if (!ignore) {
          setClientSecret(null);
          setSetupError(error instanceof Error ? error.message : "Unable to prepare checkout");
        }
      } finally {
        if (!ignore) {
          setLoadingSecret(false);
        }
      }
    }

    void loadSetupIntent();

    return () => {
      ignore = true;
    };
  }, [alreadyOnPlan, selectedTier]);

  const appearance = {
    theme: "stripe" as const,
    variables: {
      colorPrimary: "#111827",
      colorBackground: "#ffffff",
      colorText: "#111827",
      colorDanger: "#b91c1c",
      borderRadius: "18px",
    },
  };

  return (
    <Card className="border-border/70 bg-background/70 backdrop-blur">
      <CardHeader>
        <CardTitle>Checkout</CardTitle>
        <CardDescription>
          Secure on-site billing powered by Stripe Elements.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2">
          {(["creator", "growth"] as PaidTier[]).map((tier) => {
            const plan = plans[tier];
            const isActive = selectedTier === tier;

            return (
              <button
                key={tier}
                type="button"
                className={`rounded-[22px] border p-4 text-left transition ${
                  isActive ? "border-foreground bg-foreground text-background" : "border-border/70 bg-muted/20"
                }`}
                onClick={() => setSelectedTier(tier)}
              >
                <p className="text-sm font-medium">{plan.label}</p>
                <p className="mt-2 text-2xl font-semibold">{formatPrice(plan.amount, plan.currency)}</p>
                <p className={`mt-2 text-sm ${isActive ? "text-zinc-200" : "text-muted-foreground"}`}>
                  {plan.headline}
                </p>
              </button>
            );
          })}
        </div>

        <div className="rounded-[24px] border border-border/70 bg-muted/15 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{selectedPlan.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{selectedPlan.headline}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-semibold">{formatPrice(selectedPlan.amount, selectedPlan.currency)}</p>
              <p className="text-sm text-muted-foreground">per {selectedPlan.interval}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4" />
            Access updates immediately after a successful Stripe subscription.
          </div>
        </div>

        {alreadyOnPlan ? (
          <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
            This account is already on the {selectedPlan.label} tier.
          </div>
        ) : null}

        {loadingSecret ? <p className="text-sm text-muted-foreground">Preparing checkout…</p> : null}
        {setupError ? <p className="text-sm text-destructive">{setupError}</p> : null}

        {!alreadyOnPlan && clientSecret && stripePromise ? (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance,
            }}
          >
            <CheckoutForm
              selectedTier={selectedTier}
              onSuccess={() => window.location.assign("/dashboard/billing?success=1")}
            />
          </Elements>
        ) : null}
      </CardContent>
    </Card>
  );
}
