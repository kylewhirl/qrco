import "server-only";

import Stripe from "stripe";
import type { BillingTier } from "@/lib/billing-definitions";

let stripeInstance: Stripe | null = null;
const priceIdCache = new Map<Exclude<BillingTier, "free">, string>();

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-05-28.basil",
    });
  }

  return stripeInstance;
}

function resolveProductIdForTier(tier: Exclude<BillingTier, "free">) {
  if (tier === "creator") {
    return process.env.STRIPE_CREATOR_PRODUCT_ID ?? null;
  }

  return process.env.STRIPE_GROWTH_PRODUCT_ID ?? null;
}

async function lookupMonthlyPriceIdByProduct(productId: string) {
  const stripe = getStripe();
  const prices = await stripe.prices.list({
    active: true,
    product: productId,
    type: "recurring",
    limit: 20,
  });

  const monthlyPrice = prices.data.find(
    (price) => price.active && price.recurring?.interval === "month",
  );

  if (!monthlyPrice) {
    throw new Error(`No active monthly Stripe price found for product ${productId}`);
  }

  return monthlyPrice.id;
}

export async function getStripePriceIdForTier(tier: Exclude<BillingTier, "free">) {
  const cached = priceIdCache.get(tier);
  if (cached) {
    return cached;
  }

  const configuredPriceId =
    tier === "creator"
      ? process.env.STRIPE_CREATOR_PRICE_ID
      : process.env.STRIPE_GROWTH_PRICE_ID ?? process.env.STRIPE_BUSINESS_PRICE_ID;

  if (configuredPriceId) {
    priceIdCache.set(tier, configuredPriceId);
    return configuredPriceId;
  }

  const productId = resolveProductIdForTier(tier);
  if (!productId) {
    throw new Error(`Missing Stripe product configuration for tier ${tier}`);
  }

  const resolvedPriceId = await lookupMonthlyPriceIdByProduct(productId);
  priceIdCache.set(tier, resolvedPriceId);
  return resolvedPriceId;
}

export function resolveTierFromStripePrice(
  priceId?: string | null,
  productId?: string | null,
): Exclude<BillingTier, "free"> | null {
  if (!priceId && !productId) {
    return null;
  }

  if (
    priceId === process.env.STRIPE_CREATOR_PRICE_ID ||
    productId === process.env.STRIPE_CREATOR_PRODUCT_ID
  ) {
    return "creator";
  }

  if (
    priceId === process.env.STRIPE_GROWTH_PRICE_ID ||
    priceId === process.env.STRIPE_BUSINESS_PRICE_ID ||
    productId === process.env.STRIPE_GROWTH_PRODUCT_ID
  ) {
    return "growth";
  }

  return null;
}
