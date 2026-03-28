import { redirect } from "next/navigation";

import { CheckoutExperience } from "@/components/billing/checkout-experience";
import { getCurrentUserBillingState, getStripeCheckoutPlanCatalog } from "@/lib/billing";
import { stackServerApp } from "@/stack";

export default async function CheckoutPage({
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

  return (
    <CheckoutExperience
      currentTier={billingState.tier}
      initialTier={initialTier}
      customerEmail={user.primaryEmail ?? null}
      plans={{
        creator: {
          ...planCatalog.creator,
          label: "Creator",
          features: [
            "Unlimited AI-generated QR codes",
          ],
        },
        growth: {
          ...planCatalog.growth,
          label: "Growth",
          features: [
            "Unlimited API usage",
          ],
        },
      }}
    />
  );
}
