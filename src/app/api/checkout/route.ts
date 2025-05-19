// /src/pages/api/stripe/checkout.ts
import { NextResponse } from 'next/server';
import { StackServerApp } from '@stackframe/stack';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const stack = new StackServerApp({
  tokenStore: 'nextjs-cookie',
  urls: { signIn: '/login' },
});

export async function POST() {
  // 1) Authenticate the user via Stack-Auth
  const user = await stack.getUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  // 2) Create or fetch a Stripe Customer tied to this user
  //    (You might store stripeCustomerId on your own user record in your DB)
  let stripeCustomerId = user.serverMetadata?.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.primaryEmail ?? undefined,
      metadata: { stackUserId: user.id },
    });
    stripeCustomerId = customer.id;
    // Save stripeCustomerId in Stack-Auth metadata
    await user.update({
      serverMetadata: {
        ...(user.serverMetadata || {}),
        stripeCustomerId,
      },
    });
  }

  // 3) Create a Checkout session
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: stripeCustomerId,
    line_items: [
      { price: process.env.STRIPE_CREATOR_PRICE_ID!, quantity: 1 },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    metadata: { stackUserId: user.id },
  });

  return NextResponse.json({ url: session.url });
}