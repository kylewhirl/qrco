import { NextResponse } from "next/server";

import { getCurrentUserBillingState } from "@/lib/billing";

export async function GET() {
  try {
    const billingState = await getCurrentUserBillingState();
    return NextResponse.json({
      billing: {
        tier: billingState.tier,
        label: billingState.plan.label,
        headline: billingState.plan.headline,
        paid: billingState.plan.paid,
        access: billingState.plan.access,
        limits: billingState.plan.limits,
        usage: billingState.usage,
        subscription: billingState.subscription,
      },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
