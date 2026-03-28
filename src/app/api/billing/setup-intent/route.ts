import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { ensureStripeCustomerForUser, getCurrentUserBillingState } from "@/lib/billing";
import { getStripe } from "@/lib/stripe";
import { stackServerApp } from "@/stack";

const requestSchema = z.object({
  tier: z.enum(["creator", "growth"]),
});

export async function POST(request: NextRequest) {
  const user = await stackServerApp.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid billing tier" }, { status: 400 });
  }

  const billingState = await getCurrentUserBillingState();
  if (billingState.tier === parsed.data.tier) {
    return NextResponse.json({ error: `You are already on the ${billingState.plan.label} tier.` }, { status: 409 });
  }

  const customerId = await ensureStripeCustomerForUser(user);
  const stripe = getStripe();
  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    usage: "off_session",
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: {
      stackUserId: user.id,
      targetTier: parsed.data.tier,
    },
  });

  return NextResponse.json({
    clientSecret: setupIntent.client_secret,
    customerId,
  });
}
