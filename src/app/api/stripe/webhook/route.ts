import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { buildBillingMetadataUpdate } from "@/lib/billing";
import { getStripe } from "@/lib/stripe";
import { stackServerApp } from "@/stack";

function toSubscriptionSnapshot(subscription: Stripe.Subscription) {
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

async function findStackUserIdForSubscription(subscription: Stripe.Subscription) {
  if (subscription.metadata?.stackUserId) {
    return subscription.metadata.stackUserId;
  }

  if (!subscription.customer) {
    return null;
  }

  const stripe = getStripe();
  const customer = typeof subscription.customer === "string"
    ? await stripe.customers.retrieve(subscription.customer)
    : subscription.customer;

  if (customer.deleted) {
    return null;
  }

  return customer.metadata?.stackUserId ?? null;
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing webhook configuration" }, { status: 400 });
  }

  const rawBody = Buffer.from(await request.arrayBuffer());
  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid Stripe signature" },
      { status: 400 },
    );
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const stackUserId = await findStackUserIdForSubscription(subscription);
      if (!stackUserId) {
        break;
      }

      const user = await stackServerApp.getUser(stackUserId);
      if (!user) {
        break;
      }

      await user.update({
        serverMetadata: buildBillingMetadataUpdate(user.serverMetadata, {
          stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id ?? null,
          accessOverrideTier: null,
          stripeSubscription: toSubscriptionSnapshot(subscription),
        }),
      });
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
