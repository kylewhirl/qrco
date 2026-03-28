import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  BillingAccessError,
  buildBillingMetadataUpdate,
  ensureStripeCustomerForUser,
} from "@/lib/billing";
import { getStripe, getStripePriceIdForTier } from "@/lib/stripe";
import { stackServerApp } from "@/stack";

const requestSchema = z.object({
  tier: z.enum(["creator", "growth"]),
  paymentMethodId: z.string().min(1),
});

function isReusableStripeError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "resource_already_exists"
  );
}

function getSubscriptionSnapshot(subscription: Awaited<ReturnType<ReturnType<typeof getStripe>["subscriptions"]["create"]>>) {
  const item = subscription.items.data[0];
  return {
    id: subscription.id,
    status: subscription.status,
    priceId: item?.price.id ?? null,
    productId: typeof item?.price.product === "string" ? item.price.product : item?.price.product?.id ?? null,
    currentPeriodStart: (subscription as { current_period_start?: number }).current_period_start ?? null,
    currentPeriodEnd: (subscription as { current_period_end?: number }).current_period_end ?? null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
  };
}

export async function POST(request: NextRequest) {
  const user = await stackServerApp.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid billing payload" }, { status: 400 });
  }

  const stripe = getStripe();
  const customerId = await ensureStripeCustomerForUser(user);
  const priceId = await getStripePriceIdForTier(parsed.data.tier);

  try {
    await stripe.paymentMethods.attach(parsed.data.paymentMethodId, {
      customer: customerId,
    });
  } catch (error) {
    if (!isReusableStripeError(error)) {
      throw error;
    }
  }

  await stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: parsed.data.paymentMethodId,
    },
    metadata: {
      stackUserId: user.id,
    },
  });

  const existingSubscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 10,
  });

  const activeSubscription = existingSubscriptions.data.find((subscription) =>
    ["active", "trialing", "past_due", "incomplete"].includes(subscription.status),
  );

  const subscription = activeSubscription
    ? await stripe.subscriptions.update(activeSubscription.id, {
        cancel_at_period_end: false,
        default_payment_method: parsed.data.paymentMethodId,
        items: activeSubscription.items.data[0]
          ? [
              {
                id: activeSubscription.items.data[0].id,
                price: priceId,
              },
            ]
          : [{ price: priceId }],
        metadata: {
          stackUserId: user.id,
          targetTier: parsed.data.tier,
        },
        expand: ["items.data.price.product"],
      })
    : await stripe.subscriptions.create({
        customer: customerId,
        default_payment_method: parsed.data.paymentMethodId,
        payment_settings: {
          save_default_payment_method: "on_subscription",
        },
        items: [{ price: priceId }],
        metadata: {
          stackUserId: user.id,
          targetTier: parsed.data.tier,
        },
        expand: ["items.data.price.product"],
      });

  const snapshot = getSubscriptionSnapshot(subscription);
  await user.update({
    serverMetadata: buildBillingMetadataUpdate(user.serverMetadata, {
      stripeCustomerId: customerId,
      accessOverrideTier: null,
      stripeSubscription: snapshot,
    }),
  });

  if (!["active", "trialing", "past_due"].includes(subscription.status)) {
    throw new BillingAccessError(
      "Stripe created the subscription, but it is not active yet. Try a different payment method.",
      { status: 402, code: "subscription_incomplete", requiredTier: parsed.data.tier },
    );
  }

  return NextResponse.json({
    ok: true,
    subscriptionId: subscription.id,
    status: subscription.status,
  });
}
