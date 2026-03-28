import { NextResponse } from "next/server";

import { ensureStripeCustomerForUser, getCurrentUserBillingState } from "@/lib/billing";
import { getStripe } from "@/lib/stripe";
import { stackServerApp } from "@/stack";

export async function POST() {
  const user = await stackServerApp.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const billingState = await getCurrentUserBillingState();
  if (!billingState.plan.paid) {
    return NextResponse.json({ error: "No paid subscription to manage yet." }, { status: 409 });
  }

  const customerId = await ensureStripeCustomerForUser(user);
  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
  });

  return NextResponse.json({ url: session.url });
}
