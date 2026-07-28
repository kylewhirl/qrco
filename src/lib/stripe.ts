import "server-only";

import Stripe from "stripe";
import type { BillingTier } from "@/lib/billing-definitions";

let stripeInstance: Stripe | null = null;
const priceIdCache = new Map<Exclude<BillingTier, "free">, string>();

function isStripeResourceMissingError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "resource_missing"
  );
}

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-08-27.basil",
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

async function resolveExistingConfiguredPriceId(
  tier: Exclude<BillingTier, "free">,
  configuredPriceId: string,
  productId: string | null,
) {
  const stripe = getStripe();

  try {
    const price = await stripe.prices.retrieve(configuredPriceId);
    if (!price.deleted) {
      priceIdCache.set(tier, price.id);
      return price.id;
    }
  } catch (error) {
    if (!isStripeResourceMissingError(error)) {
      throw error;
    }
  }

  if (!productId) {
    throw new Error(`Configured Stripe price ${configuredPriceId} was not found for tier ${tier}`);
  }

  const fallbackPriceId = await lookupMonthlyPriceIdByProduct(productId);
  priceIdCache.set(tier, fallbackPriceId);
  return fallbackPriceId;
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
  const productId = resolveProductIdForTier(tier);

  if (configuredPriceId) {
    return resolveExistingConfiguredPriceId(tier, configuredPriceId, productId);
  }

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
