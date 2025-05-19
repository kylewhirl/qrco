import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { StackServerApp } from '@stackframe/stack';

// Extend SubscriptionItem to include the billing-period fields
type RawSubItem = Stripe.SubscriptionItem & {
  current_period_end: number;
  current_period_start: number;
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const stack = new StackServerApp({
  tokenStore: 'nextjs-cookie',
  urls: { signIn: '/login' },
});

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature')!;
  const buf = Buffer.from(await req.arrayBuffer());
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }


  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (!session.metadata || !session.metadata.stackUserId) {
        return NextResponse.json({ error: 'Missing stackUserId in session metadata' }, { status: 400 });
      }
      const stackUserId = session.metadata.stackUserId;
      const serverUser = await stack.getUser(stackUserId);
      if (serverUser) {
        await serverUser.update({
          serverMetadata: {
            ...(serverUser.serverMetadata || {}),
            stripeSubscription: {
              id: session.subscription,
              status: 'active',
              currentPeriodEnd: undefined,
              priceId: undefined,
            },
          },
        });
      }
      break;
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      // The subscription object
      const sub = event.data.object as Stripe.Subscription;
      // Grab the first item with its billing period
      const item = sub.items.data[0] as RawSubItem;
      const stackUserId = sub.metadata.stackUserId!;
      const serverUser = await stack.getUser(stackUserId);
      if (serverUser) {
        await serverUser.update({
          serverMetadata: {
            ...(serverUser.serverMetadata || {}),
            stripeSubscription: {
              id: sub.id,
              status: sub.status || 'active',
              currentPeriodEnd: item.current_period_end,
              priceId: item.price.id,
            },
          },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}