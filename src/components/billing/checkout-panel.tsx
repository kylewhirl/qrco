"use client";

import { useEffect, useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { CreditCard, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";

import type { BillingTier } from "@/lib/billing-definitions";

type PaidTier = Exclude<BillingTier, "free">;

export type CheckoutFormState = {
  alreadyOnPlan: boolean;
  loading: boolean;
  ready: boolean;
  submitting: boolean;
  error: string | null;
};

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

function CheckoutForm({
  selectedTier,
  onSuccess,
  onStateChange,
}: {
  selectedTier: PaidTier;
  onSuccess: () => void;
  onStateChange: (state: Partial<CheckoutFormState>) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    onStateChange({
      ready: Boolean(stripe && elements),
      submitting: isSubmitting,
      error,
    });
  }, [elements, error, isSubmitting, onStateChange, stripe]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements) {
      return;
    }

    setError(null);
    setIsSubmitting(true);
    onStateChange({ error: null, submitting: true });

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
      const message = submitError instanceof Error ? submitError.message : "Unable to complete checkout";
      console.error("Billing submit failed:", submitError);
      setError(message);
      onStateChange({ error: message });
      toast.error(message);
    } finally {
      setIsSubmitting(false);
      onStateChange({ submitting: false });
    }
  }

  return (
    <form id="checkout-payment-form" className="space-y-4" onSubmit={handleSubmit}>
      <div className="rounded-[20px] border border-white/10 bg-[#252525] px-4 py-3">
        <PaymentElement />
      </div>
      {error ? <p className="text-sm text-[#ff7b7b]">{error}</p> : null}
    </form>
  );
}

export function BillingCheckoutPanel({
  currentTier,
  selectedTier,
  customerEmail,
  onStateChange,
}: {
  currentTier: BillingTier;
  selectedTier: PaidTier;
  customerEmail: string | null;
  onStateChange: (state: CheckoutFormState) => void;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingSecret, setLoadingSecret] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  const alreadyOnPlan = currentTier === selectedTier;

  useEffect(() => {
    onStateChange({
      alreadyOnPlan,
      loading: loadingSecret,
      ready: Boolean(clientSecret && stripePromise),
      submitting: false,
      error: setupError,
    });
  }, [alreadyOnPlan, clientSecret, loadingSecret, onStateChange, setupError]);

  useEffect(() => {
    let ignore = false;

    async function loadSetupIntent() {
      if (!publishableKey) {
        if (!ignore) {
          setSetupError("Missing Stripe publishable key");
          setClientSecret(null);
          setLoadingSecret(false);
        }
        return;
      }

      if (alreadyOnPlan) {
        if (!ignore) {
          setSetupError(null);
          setClientSecret(null);
          setLoadingSecret(false);
        }
        return;
      }

      try {
        if (!ignore) {
          setLoadingSecret(true);
          setSetupError(null);
        }

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

  const appearance = useMemo(() => ({
    theme: "night" as const,
    variables: {
      colorPrimary: "#f4f4f4",
      colorBackground: "#252525",
      colorText: "#f4f4f4",
      colorTextSecondary: "#9d9d9d",
      colorDanger: "#ff7b7b",
      colorSuccess: "#b39cff",
      colorIcon: "#bdbdbd",
      colorTextPlaceholder: "#777777",
      borderRadius: "18px",
      spacingUnit: "4px",
      fontFamily: "var(--font-montserrat)",
    },
    rules: {
      ".Input": {
        backgroundColor: "#252525",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "none",
      },
      ".Input:focus": {
        border: "1px solid rgba(255,255,255,0.24)",
        boxShadow: "none",
      },
      ".Tab": {
        backgroundColor: "#252525",
        border: "1px solid rgba(255,255,255,0.08)",
      },
      ".Tab:hover": {
        color: "#f4f4f4",
      },
      ".Tab--selected": {
        backgroundColor: "#303030",
        border: "1px solid rgba(255,255,255,0.18)",
      },
      ".Block": {
        backgroundColor: "#252525",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "none",
      },
      ".Label": {
        color: "#9d9d9d",
      },
      ".CodeInput": {
        backgroundColor: "#2a2a2a",
        border: "1px solid rgba(255,255,255,0.08)",
      },
    },
  }), []);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <p className="text-[12px] font-medium text-[#d8d8d8]">Payment method</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 rounded-[16px] border border-white/20 bg-[#252525] px-4 py-3 text-sm text-white">
            <CreditCard className="h-4 w-4" />
            <span>Card</span>
          </div>
          <div className="flex items-center gap-3 rounded-[16px] border border-white/8 bg-[#252525] px-4 py-3 text-sm text-[#9d9d9d]">
            <Wallet className="h-4 w-4" />
            <span>Wallets in Stripe</span>
          </div>
        </div>
      </div>

      <div className="rounded-[20px] border border-white/8 bg-[#252525] p-4">
        <div className="space-y-1 border-b border-white/8 pb-4">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#8a8a8a]">Contact</p>
          <p className="text-sm text-white">{customerEmail ?? "No email available"}</p>
        </div>

        <div className="pt-4">
          {alreadyOnPlan ? (
            <div className="rounded-[18px] border border-white/8 bg-[#1f1f1f] px-4 py-3 text-sm text-[#cfcfcf]">
              This account is already on the {selectedTier === "creator" ? "Creator" : "Growth"} plan.
            </div>
          ) : null}

          {loadingSecret ? (
            <div className="flex items-center gap-2 rounded-[18px] border border-white/8 bg-[#1f1f1f] px-4 py-3 text-sm text-[#bdbdbd]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Preparing payment form
            </div>
          ) : null}

          {setupError && !alreadyOnPlan ? (
            <div className="rounded-[18px] border border-[#5e2a2a] bg-[#2b1717] px-4 py-3 text-sm text-[#ff9f9f]">
              {setupError}
            </div>
          ) : null}

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
                onStateChange={(partialState) =>
                  onStateChange({
                    alreadyOnPlan,
                    loading: loadingSecret,
                    ready: Boolean((partialState.ready ?? false) && clientSecret && stripePromise),
                    submitting: partialState.submitting ?? false,
                    error: partialState.error ?? setupError,
                  })
                }
              />
            </Elements>
          ) : null}
        </div>
      </div>
    </div>
  );
}
