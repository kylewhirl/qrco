#!/usr/bin/env node

const Stripe = require("stripe");

const REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_STACK_PROJECT_ID",
  "NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY",
  "STACK_SECRET_SERVER_KEY",
  "STRIPE_SECRET_KEY",
  "BILLING_GROWTH_EMAIL",
  "BILLING_GROWTH_PASSWORD",
  "BILLING_CREATOR_EMAIL",
  "BILLING_CREATOR_PASSWORD",
  "BILLING_FREE_EMAIL",
  "BILLING_FREE_PASSWORD",
];

for (const key of REQUIRED_ENV_VARS) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-05-28.basil",
});

const billingSeedMode = process.env.BILLING_SEED_MODE === "override" ? "override" : "stripe";
const stackApiBaseUrl =
  process.env.NEXT_PUBLIC_SERVER_STACK_API_URL ||
  process.env.NEXT_PUBLIC_STACK_API_URL ||
  process.env.NEXT_PUBLIC_STACK_URL ||
  "https://api.stack-auth.com";

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing", "past_due", "incomplete"]);

function getCurrentPeriodKey(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function stackHeaders(extra = {}) {
  return {
    "Content-Type": "application/json",
    "X-Stack-Override-Error-Status": "true",
    "X-Stack-Project-Id": process.env.NEXT_PUBLIC_STACK_PROJECT_ID,
    "X-Stack-Publishable-Client-Key": process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY,
    "X-Stack-Secret-Server-Key": process.env.STACK_SECRET_SERVER_KEY,
    "X-Stack-Access-Type": "server",
    "X-Stack-Client-Version": "tqrco-billing-seeder",
    "X-Stack-Random-Nonce": Math.random().toString(36).slice(2),
    "ngrok-skip-browser-warning": "true",
    ...extra,
  };
}

async function stackRequest(pathname, options = {}) {
  const response = await fetch(new URL(`/api/v1${pathname}`, stackApiBaseUrl), {
    ...options,
    headers: stackHeaders(options.headers),
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Stack request failed (${response.status}) ${pathname}: ${payload}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function serverUserCreateOptionsToCrud(options) {
  return {
    primary_email: options.primaryEmail,
    password: options.password,
    otp_auth_enabled: options.otpAuthEnabled,
    primary_email_auth_enabled: options.primaryEmailAuthEnabled,
    display_name: options.displayName,
    primary_email_verified: options.primaryEmailVerified,
    client_metadata: options.clientMetadata,
    client_read_only_metadata: options.clientReadOnlyMetadata,
    server_metadata: options.serverMetadata,
  };
}

function serverUserUpdateOptionsToCrud(options) {
  return {
    display_name: options.displayName,
    primary_email: options.primaryEmail,
    client_metadata: options.clientMetadata,
    client_read_only_metadata: options.clientReadOnlyMetadata,
    server_metadata: options.serverMetadata,
    selected_team_id: options.selectedTeamId,
    primary_email_auth_enabled: options.primaryEmailAuthEnabled,
    primary_email_verified: options.primaryEmailVerified,
    password: options.password,
    profile_image_url: options.profileImageUrl,
  };
}

function buildBillingMetadata(previousServerMetadata, input) {
  const previous =
    previousServerMetadata && typeof previousServerMetadata === "object"
      ? previousServerMetadata
      : {};

  const previousBilling =
    previous.billing && typeof previous.billing === "object"
      ? previous.billing
      : {};

  const nextCustomerId =
    input.stripeCustomerId !== undefined
      ? input.stripeCustomerId
      : previousBilling.stripeCustomerId ?? previous.stripeCustomerId ?? null;

  const nextOverrideTier =
    input.accessOverrideTier !== undefined
      ? input.accessOverrideTier
      : previousBilling.accessOverrideTier ?? null;

  const nextSubscription =
    input.stripeSubscription !== undefined
      ? input.stripeSubscription
      : previousBilling.stripeSubscription ?? previous.stripeSubscription ?? null;

  return {
    ...previous,
    stripeCustomerId: nextCustomerId,
    stripeSubscription: nextSubscription,
    billing: {
      ...previousBilling,
      stripeCustomerId: nextCustomerId,
      accessOverrideTier: nextOverrideTier,
      stripeSubscription: nextSubscription,
    },
  };
}

function getSubscriptionSnapshot(subscription) {
  const item = subscription.items?.data?.[0];
  return {
    id: subscription.id,
    status: subscription.status,
    priceId: item?.price?.id ?? null,
    productId:
      typeof item?.price?.product === "string"
        ? item.price.product
        : item?.price?.product?.id ?? null,
    currentPeriodStart: subscription.current_period_start ?? null,
    currentPeriodEnd: subscription.current_period_end ?? null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
  };
}

async function lookupMonthlyPriceIdByProduct(productId) {
  const prices = await stripe.prices.list({
    active: true,
    product: productId,
    type: "recurring",
    limit: 20,
  });

  const monthlyPrice = prices.data.find((price) => price.active && price.recurring?.interval === "month");
  if (!monthlyPrice) {
    throw new Error(`No active monthly price found for product ${productId}`);
  }

  return monthlyPrice.id;
}

async function getPriceIdForTier(tier) {
  if (tier === "creator") {
    if (process.env.STRIPE_CREATOR_PRICE_ID) {
      return process.env.STRIPE_CREATOR_PRICE_ID;
    }

    if (!process.env.STRIPE_CREATOR_PRODUCT_ID) {
      throw new Error("Missing STRIPE_CREATOR_PRODUCT_ID");
    }

    return lookupMonthlyPriceIdByProduct(process.env.STRIPE_CREATOR_PRODUCT_ID);
  }

  if (process.env.STRIPE_GROWTH_PRICE_ID) {
    return process.env.STRIPE_GROWTH_PRICE_ID;
  }

  if (!process.env.STRIPE_GROWTH_PRODUCT_ID) {
    throw new Error("Missing STRIPE_GROWTH_PRODUCT_ID");
  }

  return lookupMonthlyPriceIdByProduct(process.env.STRIPE_GROWTH_PRODUCT_ID);
}

async function findUserByEmail(email) {
  const params = new URLSearchParams({
    query: email,
    limit: "20",
  });
  const response = await stackRequest(`/users?${params.toString()}`);

  return response.items.find((user) => user.primary_email?.toLowerCase() === email.toLowerCase()) ?? null;
}

async function getUserById(userId) {
  return stackRequest(`/users/${userId}`);
}

async function upsertStackUser({ email, password, displayName, serverMetadata }) {
  const existing = await findUserByEmail(email);

  if (!existing) {
    return stackRequest("/users", {
      method: "POST",
      body: JSON.stringify(
      serverUserCreateOptionsToCrud({
        primaryEmail: email,
        primaryEmailAuthEnabled: true,
        primaryEmailVerified: true,
        password,
        displayName,
        serverMetadata,
      }),
      ),
    });
  }

  await stackRequest(`/users/${existing.id}`, {
    method: "PATCH",
    body: JSON.stringify(
      serverUserUpdateOptionsToCrud({
      primaryEmail: email,
      primaryEmailAuthEnabled: true,
      primaryEmailVerified: true,
      password,
      displayName,
      serverMetadata,
      }),
    ),
  });

  return getUserById(existing.id);
}

async function ensureStripeCustomer({ email, displayName, stackUserId }) {
  const existing = await stripe.customers.list({
    email,
    limit: 10,
  });

  const customer =
    existing.data[0] ??
    (await stripe.customers.create({
      email,
      name: displayName,
      metadata: {
        stackUserId,
      },
    }));

  await stripe.customers.update(customer.id, {
    name: displayName,
    metadata: {
      ...(customer.metadata ?? {}),
      stackUserId,
    },
  });

  return customer.id;
}

async function ensureReusableTestPaymentMethod(customerId) {
  const paymentMethod = await stripe.paymentMethods.create({
    type: "card",
    card: {
      token: "tok_visa",
    },
  });

  await stripe.paymentMethods.attach(paymentMethod.id, {
    customer: customerId,
  });

  await stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethod.id,
    },
  });

  return paymentMethod.id;
}

async function ensureStripeSubscription({ customerId, priceId, stackUserId, targetTier }) {
  const paymentMethodId = await ensureReusableTestPaymentMethod(customerId);

  const existing = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 20,
  });

  const reusable = existing.data.find((subscription) => ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status));

  if (reusable) {
    const updated = await stripe.subscriptions.update(reusable.id, {
      cancel_at_period_end: false,
      default_payment_method: paymentMethodId,
      items: reusable.items.data[0]
        ? [
            {
              id: reusable.items.data[0].id,
              price: priceId,
            },
          ]
        : [{ price: priceId }],
      metadata: {
        ...(reusable.metadata ?? {}),
        stackUserId,
        targetTier,
      },
      expand: ["items.data.price.product"],
    });

    return updated;
  }

  return stripe.subscriptions.create({
    customer: customerId,
    default_payment_method: paymentMethodId,
    payment_settings: {
      save_default_payment_method: "on_subscription",
    },
    items: [{ price: priceId }],
    metadata: {
      stackUserId,
      targetTier,
    },
    expand: ["items.data.price.product"],
  });
}

async function clearStripeSubscriptions(customerId) {
  const existing = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 20,
  });

  for (const subscription of existing.data) {
    if (ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)) {
      await stripe.subscriptions.cancel(subscription.id);
    }
  }
}

async function seedFreeAccount(account) {
  const existing = await findUserByEmail(account.email);
  const serverMetadata = buildBillingMetadata(existing?.server_metadata, {
    stripeCustomerId: null,
    accessOverrideTier: null,
    stripeSubscription: null,
  });

  const user = await upsertStackUser({
    ...account,
    serverMetadata,
  });

  const customerId = serverMetadata.billing?.stripeCustomerId || serverMetadata.stripeCustomerId;
  if (customerId) {
    await clearStripeSubscriptions(customerId);
  }

  return {
    email: account.email,
    tier: "free",
    userId: user.id,
  };
}

async function seedOverrideAccount(account) {
  const existing = await findUserByEmail(account.email);
  const serverMetadata = buildBillingMetadata(existing?.server_metadata, {
    stripeCustomerId: null,
    accessOverrideTier: account.tier,
    stripeSubscription: null,
  });

  const user = await upsertStackUser({
    ...account,
    serverMetadata,
  });

  return {
    email: account.email,
    tier: account.tier,
    userId: user.id,
    mode: "override",
  };
}

async function seedPaidAccount(account) {
  const existing = await findUserByEmail(account.email);
  const bootstrapMetadata = buildBillingMetadata(existing?.server_metadata, {
    accessOverrideTier: null,
  });

  const user = await upsertStackUser({
    ...account,
    serverMetadata: bootstrapMetadata,
  });

  const customerId = await ensureStripeCustomer({
    email: account.email,
    displayName: account.displayName,
    stackUserId: user.id,
  });
  const priceId = await getPriceIdForTier(account.tier);
  const subscription = await ensureStripeSubscription({
    customerId,
    priceId,
    stackUserId: user.id,
    targetTier: account.tier,
  });

  const finalMetadata = buildBillingMetadata(user.server_metadata, {
    stripeCustomerId: customerId,
    accessOverrideTier: null,
    stripeSubscription: getSubscriptionSnapshot(subscription),
  });

  await stackRequest(`/users/${user.id}`, {
    method: "PATCH",
    body: JSON.stringify(
      serverUserUpdateOptionsToCrud({
      displayName: account.displayName,
      primaryEmail: account.email,
      primaryEmailAuthEnabled: true,
      primaryEmailVerified: true,
      password: account.password,
      serverMetadata: finalMetadata,
      }),
    ),
  });

  return {
    email: account.email,
    tier: account.tier,
    userId: user.id,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    subscriptionStatus: subscription.status,
    billingPeriod: getCurrentPeriodKey(),
  };
}

async function main() {
  const accounts = [
    {
      tier: "growth",
      email: process.env.BILLING_GROWTH_EMAIL,
      password: process.env.BILLING_GROWTH_PASSWORD,
      displayName: process.env.BILLING_GROWTH_NAME || "Kyle Worrall",
    },
    {
      tier: "creator",
      email: process.env.BILLING_CREATOR_EMAIL,
      password: process.env.BILLING_CREATOR_PASSWORD,
      displayName: process.env.BILLING_CREATOR_NAME || "TQRCO Creator Test",
    },
    {
      tier: "free",
      email: process.env.BILLING_FREE_EMAIL,
      password: process.env.BILLING_FREE_PASSWORD,
      displayName: process.env.BILLING_FREE_NAME || "TQRCO Free Test",
    },
  ];

  const results = [];
  for (const account of accounts) {
    if (account.tier === "free") {
      results.push(await seedFreeAccount(account));
    } else if (billingSeedMode === "override") {
      results.push(await seedOverrideAccount(account));
    } else {
      results.push(await seedPaidAccount(account));
    }
  }

  console.log(JSON.stringify({ ok: true, results }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
