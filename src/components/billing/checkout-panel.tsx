"use client";

import { useEffect, useRef, useState } from "react";
import { type Appearance, loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { Loader2 } from "lucide-react";
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
const stripeFonts = [
  {
    cssSrc: "https://fonts.googleapis.com/css2?family=Montserrat:wght@200;400;700;800&display=swap",
  },
];

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
      <div className="rounded-[20px] border border-border bg-card px-4 py-3">
        <PaymentElement
          options={{
            layout: {
              type: "tabs",
              defaultCollapsed: false,
            },
          }}
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
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
  const [appearance, setAppearance] = useState<Appearance | null>(null);
  const cardToneRef = useRef<HTMLDivElement | null>(null);
  const mutedToneRef = useRef<HTMLDivElement | null>(null);
  const primaryToneRef = useRef<HTMLDivElement | null>(null);
  const destructiveToneRef = useRef<HTMLDivElement | null>(null);

  const alreadyOnPlan = currentTier === selectedTier;

  function updateAppearanceFromTheme() {
    if (
      !cardToneRef.current ||
      !mutedToneRef.current ||
      !primaryToneRef.current ||
      !destructiveToneRef.current
    ) {
      return;
    }

    const cardStyles = getComputedStyle(cardToneRef.current);
    const mutedStyles = getComputedStyle(mutedToneRef.current);
    const primaryStyles = getComputedStyle(primaryToneRef.current);
    const destructiveStyles = getComputedStyle(destructiveToneRef.current);
    const isDark = document.documentElement.classList.contains("dark");

    setAppearance({
      theme: isDark ? "night" : "stripe",
      variables: {
        colorPrimary: primaryStyles.backgroundColor,
        colorBackground: cardStyles.backgroundColor,
        colorText: cardStyles.color,
        colorTextSecondary: mutedStyles.color,
        colorDanger: destructiveStyles.color,
        colorSuccess: primaryStyles.backgroundColor,
        colorTextPlaceholder: mutedStyles.color,
        iconColor: mutedStyles.color,
        tabIconColor: mutedStyles.color,
        tabIconSelectedColor: cardStyles.color,
        accessibleColorOnColorPrimary: primaryStyles.color,
        accessibleColorOnColorBackground: cardStyles.color,
        borderRadius: "18px",
        spacingUnit: "4px",
        fontFamily: "Montserrat, ui-sans-serif, system-ui, sans-serif",
        fontSizeBase: "16px",
        fontLineHeight: "1.4",
        logoColor: isDark ? "light" : "dark",
        tabLogoColor: isDark ? "light" : "dark",
        tabLogoSelectedColor: isDark ? "light" : "dark",
        blockLogoColor: isDark ? "light" : "dark",
      },
      rules: {
        ".Input": {
          backgroundColor: cardStyles.backgroundColor,
          border: `1px solid ${cardStyles.borderColor}`,
          boxShadow: "none",
          color: cardStyles.color,
        },
        ".Input:focus": {
          border: `1px solid ${primaryStyles.backgroundColor}`,
          boxShadow: `0 0 0 1px ${primaryStyles.backgroundColor}`,
        },
        ".Input::placeholder": {
          color: mutedStyles.color,
        },
        ".Input--invalid": {
          boxShadow: `0 0 0 1px ${destructiveStyles.color}`,
        },
        ".Label": {
          color: mutedStyles.color,
        },
        ".Label--invalid": {
          color: destructiveStyles.color,
        },
        ".Tab": {
          backgroundColor: mutedStyles.backgroundColor,
          border: `1px solid ${cardStyles.borderColor}`,
          boxShadow: "none",
          color: mutedStyles.color,
        },
        ".Tab:hover": {
          color: cardStyles.color,
        },
        ".Tab--selected": {
          backgroundColor: cardStyles.backgroundColor,
          border: `1px solid ${primaryStyles.backgroundColor}`,
          boxShadow: `0 0 0 1px ${primaryStyles.backgroundColor}`,
          color: cardStyles.color,
        },
        ".Block": {
          backgroundColor: cardStyles.backgroundColor,
          border: `1px solid ${cardStyles.borderColor}`,
          boxShadow: "none",
        },
        ".BlockDivider": {
          backgroundColor: cardStyles.borderColor,
        },
        ".CodeInput": {
          backgroundColor: mutedStyles.backgroundColor,
          border: `1px solid ${cardStyles.borderColor}`,
          boxShadow: "none",
        },
        ".AccordionItem": {
          border: `1px solid ${cardStyles.borderColor}`,
          borderRadius: "18px",
          boxShadow: "none",
        },
        ".AccordionItem--selected": {
          border: `1px solid ${primaryStyles.backgroundColor}`,
          boxShadow: `0 0 0 1px ${primaryStyles.backgroundColor}`,
        },
      },
    });
  }

  useEffect(() => {
    onStateChange({
      alreadyOnPlan,
      loading: loadingSecret,
      ready: Boolean(clientSecret && stripePromise && appearance),
      submitting: false,
      error: setupError,
    });
  }, [alreadyOnPlan, appearance, clientSecret, loadingSecret, onStateChange, setupError]);

  useEffect(() => {
    updateAppearanceFromTheme();

    const observer = new MutationObserver(() => {
      updateAppearanceFromTheme();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

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

  return (
    <div className="space-y-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[9999px] top-0 opacity-0"
      >
        <div ref={cardToneRef} className="border border-border bg-card text-foreground" />
        <div ref={mutedToneRef} className="bg-muted text-muted-foreground" />
        <div ref={primaryToneRef} className="bg-primary text-primary-foreground" />
        <div ref={destructiveToneRef} className="text-destructive" />
      </div>

      <div className="space-y-3">
        <p className="text-[12px] font-medium text-foreground">Payment method</p>
      </div>

      <div className="rounded-[20px] border border-border bg-card p-4">
        <div className="space-y-1 border-b border-border pb-4">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Contact</p>
          <p className="text-sm text-foreground">{customerEmail ?? "No email available"}</p>
        </div>

        <div className="pt-4">
          {alreadyOnPlan ? (
            <div className="rounded-[18px] border border-border bg-muted/60 px-4 py-3 text-sm text-foreground">
              This account is already on the {selectedTier === "creator" ? "Creator" : "Growth"} plan.
            </div>
          ) : null}

          {loadingSecret ? (
            <div className="flex items-center gap-2 rounded-[18px] border border-border bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Preparing payment form
            </div>
          ) : null}

          {setupError && !alreadyOnPlan ? (
            <div className="rounded-[18px] border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {setupError}
            </div>
          ) : null}

          {!alreadyOnPlan && clientSecret && stripePromise && appearance ? (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance,
                fonts: stripeFonts,
              }}
            >
              <CheckoutForm
                selectedTier={selectedTier}
                onSuccess={() => window.location.assign("/dashboard/billing?success=1")}
                onStateChange={(partialState) =>
                  onStateChange({
                    alreadyOnPlan,
                    loading: loadingSecret,
                    ready: Boolean((partialState.ready ?? false) && clientSecret && appearance),
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
