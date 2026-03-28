import "server-only";

import { StackServerApp, type ServerUser } from "@stackframe/stack";

import {
  BILLING_PLANS,
  type BillingFeature,
  type BillingMeter,
  type BillingTier,
  getBillingPlanConfig,
  getRequiredTierForFeature,
  PAID_BILLING_TIERS,
} from "@/lib/billing-definitions";
import { queryAdmin } from "@/lib/db";
import { getStripe, getStripePriceIdForTier, resolveTierFromStripePrice } from "@/lib/stripe";

type StripeSubscriptionSnapshot = {
  id?: string | null;
  status?: string | null;
  priceId?: string | null;
  productId?: string | null;
  currentPeriodStart?: number | null;
  currentPeriodEnd?: number | null;
  cancelAtPeriodEnd?: boolean | null;
};

type StoredBillingMetadata = {
  stripeCustomerId: string | null;
  accessOverrideTier: BillingTier | null;
  stripeSubscription: StripeSubscriptionSnapshot | null;
};

export interface BillingUsageWindow {
  used: number;
  limit: number | null;
  remaining: number | null;
}

export interface BillingState {
  tier: BillingTier;
  plan: ReturnType<typeof getBillingPlanConfig>;
  source: "free" | "stripe" | "admin_override";
  customerId: string | null;
  subscription: StripeSubscriptionSnapshot | null;
  usage: Record<BillingMeter, BillingUsageWindow>;
}

export class BillingAccessError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requiredTier: BillingTier | null;

  constructor(message: string, options?: { status?: number; code?: string; requiredTier?: BillingTier | null }) {
    super(message);
    this.name = "BillingAccessError";
    this.status = options?.status ?? 402;
    this.code = options?.code ?? "billing_required";
    this.requiredTier = options?.requiredTier ?? null;
  }
}

const stripeManagedStatuses = new Set(["active", "trialing", "past_due"]);
const stripeSyncableStatuses = new Set(["active", "trialing", "past_due", "incomplete"]);
const usageSchemaTable = '"BillingUsageCounter"';

const stackAdminApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  secretServerKey: process.env.STACK_SECRET_SERVER_KEY,
  urls: {
    signIn: "/login",
    home: "/dashboard",
    afterSignOut: "/",
  },
});

let ensureUsageSchemaPromise: Promise<void> | null = null;

function isBillingTier(value: unknown): value is BillingTier {
  return value === "free" || value === "creator" || value === "growth";
}

function isStripeSubscriptionSnapshot(value: unknown): value is StripeSubscriptionSnapshot {
  return typeof value === "object" && value !== null;
}

function getCurrentPeriodKey(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

async function ensureUsageSchema() {
  if (!ensureUsageSchemaPromise) {
    ensureUsageSchemaPromise = (async () => {
      await queryAdmin(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
      await queryAdmin(`
        CREATE TABLE IF NOT EXISTS ${usageSchemaTable} (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "userId" TEXT NOT NULL,
          meter TEXT NOT NULL,
          "periodKey" TEXT NOT NULL,
          count INTEGER NOT NULL DEFAULT 0,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE ("userId", meter, "periodKey")
        )
      `);
      await queryAdmin(`
        CREATE INDEX IF NOT EXISTS "BillingUsageCounter_user_meter_period_idx"
        ON ${usageSchemaTable} ("userId", meter, "periodKey")
      `);
    })().catch((error) => {
      ensureUsageSchemaPromise = null;
      throw error;
    });
  }

  await ensureUsageSchemaPromise;
}

async function getUsageCount(userId: string, meter: BillingMeter, periodKey = getCurrentPeriodKey()) {
  await ensureUsageSchema();
  const result = await queryAdmin<{ count: number }[]>(
    `SELECT count
     FROM ${usageSchemaTable}
     WHERE "userId" = $1
       AND meter = $2
       AND "periodKey" = $3
     LIMIT 1`,
    [userId, meter, periodKey],
  );

  return Number(result[0]?.count ?? 0);
}

async function incrementUsageCount(userId: string, meter: BillingMeter, amount = 1, periodKey = getCurrentPeriodKey()) {
  await ensureUsageSchema();
  const result = await queryAdmin<{ count: number }[]>(
    `INSERT INTO ${usageSchemaTable} ("userId", meter, "periodKey", count)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT ("userId", meter, "periodKey")
     DO UPDATE
       SET count = ${usageSchemaTable}.count + EXCLUDED.count,
           "updatedAt" = NOW()
     RETURNING count`,
    [userId, meter, periodKey, amount],
  );

  return Number(result[0]?.count ?? 0);
}

function getStoredBillingMetadata(serverMetadata: unknown): StoredBillingMetadata {
  const metadata = typeof serverMetadata === "object" && serverMetadata !== null
    ? serverMetadata as Record<string, unknown>
    : {};

  const billingMetadata =
    typeof metadata.billing === "object" && metadata.billing !== null
      ? metadata.billing as Record<string, unknown>
      : {};

  const accessOverrideTier = isBillingTier(billingMetadata.accessOverrideTier)
    ? billingMetadata.accessOverrideTier
    : null;

  const topLevelSubscription = isStripeSubscriptionSnapshot(metadata.stripeSubscription)
    ? metadata.stripeSubscription
    : null;

  const nestedSubscription = isStripeSubscriptionSnapshot(billingMetadata.stripeSubscription)
    ? billingMetadata.stripeSubscription
    : null;

  return {
    stripeCustomerId:
      typeof billingMetadata.stripeCustomerId === "string"
        ? billingMetadata.stripeCustomerId
        : typeof metadata.stripeCustomerId === "string"
          ? metadata.stripeCustomerId
          : null,
    accessOverrideTier,
    stripeSubscription: (nestedSubscription ?? topLevelSubscription) as StripeSubscriptionSnapshot | null,
  };
}

export function buildBillingMetadataUpdate(
  previousServerMetadata: unknown,
  input: {
    stripeCustomerId?: string | null;
    accessOverrideTier?: BillingTier | null;
    stripeSubscription?: StripeSubscriptionSnapshot | null;
  },
) {
  const previous = typeof previousServerMetadata === "object" && previousServerMetadata !== null
    ? previousServerMetadata as Record<string, unknown>
    : {};
  const stored = getStoredBillingMetadata(previousServerMetadata);

  const nextCustomerId =
    input.stripeCustomerId !== undefined ? input.stripeCustomerId : stored.stripeCustomerId;
  const nextOverrideTier =
    input.accessOverrideTier !== undefined ? input.accessOverrideTier : stored.accessOverrideTier;
  const nextSubscription =
    input.stripeSubscription !== undefined ? input.stripeSubscription : stored.stripeSubscription;

  return {
    ...previous,
    stripeCustomerId: nextCustomerId,
    stripeSubscription: nextSubscription,
    billing: {
      ...(typeof previous.billing === "object" && previous.billing !== null
        ? previous.billing as Record<string, unknown>
        : {}),
      stripeCustomerId: nextCustomerId,
      accessOverrideTier: nextOverrideTier,
      stripeSubscription: nextSubscription,
    },
  };
}

async function buildUsageWindow(userId: string, meter: BillingMeter, limit: number | null): Promise<BillingUsageWindow> {
  if (limit === 0) {
    return {
      used: 0,
      limit,
      remaining: 0,
    };
  }

  const used = await getUsageCount(userId, meter);
  return {
    used,
    limit,
    remaining: limit === null ? null : Math.max(limit - used, 0),
  };
}

function resolveTierFromStoredMetadata(metadata: StoredBillingMetadata): { tier: BillingTier; source: BillingState["source"] } {
  if (metadata.accessOverrideTier) {
    return {
      tier: metadata.accessOverrideTier,
      source: "admin_override",
    };
  }

  const subscription = metadata.stripeSubscription;
  if (subscription?.status && stripeManagedStatuses.has(subscription.status)) {
    const stripeTier = resolveTierFromStripePrice(subscription.priceId, subscription.productId);
    if (stripeTier) {
      return {
        tier: stripeTier,
        source: "stripe",
      };
    }

    return {
      tier: "growth",
      source: "stripe",
    };
  }

  return {
    tier: "free",
    source: "free",
  };
}

function areSnapshotsEqual(a: StripeSubscriptionSnapshot | null, b: StripeSubscriptionSnapshot | null) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

function toSubscriptionSnapshot(subscription: Awaited<ReturnType<ReturnType<typeof getStripe>["subscriptions"]["list"]>>["data"][number]): StripeSubscriptionSnapshot {
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

async function reconcileStripeSubscriptionForUser(
  user: Pick<ServerUser, "serverMetadata" | "update">,
  stored: StoredBillingMetadata,
) {
  if (stored.accessOverrideTier || !stored.stripeCustomerId) {
    return stored;
  }

  const subscriptions = await getStripe().subscriptions.list({
    customer: stored.stripeCustomerId,
    status: "all",
    limit: 10,
    expand: ["data.items.data.price.product"],
  });

  const activeSubscription =
    subscriptions.data.find((subscription) => stripeSyncableStatuses.has(subscription.status)) ?? null;
  const nextSnapshot = activeSubscription ? toSubscriptionSnapshot(activeSubscription) : null;

  if (areSnapshotsEqual(stored.stripeSubscription, nextSnapshot)) {
    return stored;
  }

  await user.update({
    serverMetadata: buildBillingMetadataUpdate(user.serverMetadata, {
      stripeCustomerId: stored.stripeCustomerId,
      stripeSubscription: nextSnapshot,
    }),
  });

  return {
    ...stored,
    stripeSubscription: nextSnapshot,
  };
}

export async function getBillingStateForUser(user: Pick<ServerUser, "id" | "serverMetadata" | "update">): Promise<BillingState> {
  const initialStored = getStoredBillingMetadata(user.serverMetadata);
  const stored = await reconcileStripeSubscriptionForUser(user, initialStored);
  const resolved = resolveTierFromStoredMetadata(stored);
  const plan = getBillingPlanConfig(resolved.tier);

  return {
    tier: resolved.tier,
    plan,
    source: resolved.source,
    customerId: stored.stripeCustomerId,
    subscription: stored.stripeSubscription,
    usage: {
      ai_generations: await buildUsageWindow(user.id, "ai_generations", plan.limits.aiGenerationsPerMonth),
      api_requests: await buildUsageWindow(user.id, "api_requests", plan.limits.apiRequestsPerMonth),
    },
  };
}

export async function getBillingStateForUserId(userId: string) {
  const user = await stackAdminApp.getUser(userId);
  if (!user) {
    throw new Error("User not found");
  }

  return getBillingStateForUser(user);
}

export async function getCurrentUserBillingState() {
  const user = await stackAdminApp.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  return getBillingStateForUser(user);
}

export function assertBillingFeatureAccess(state: BillingState, feature: BillingFeature) {
  if (state.plan.access[feature]) {
    return;
  }

  throw new BillingAccessError(
    `${getBillingPlanConfig(getRequiredTierForFeature(feature)).label} is required to use this feature.`,
    {
      status: 402,
      code: "feature_locked",
      requiredTier: getRequiredTierForFeature(feature),
    },
  );
}

export async function requireBillingFeatureForUserId(userId: string, feature: BillingFeature) {
  const state = await getBillingStateForUserId(userId);
  assertBillingFeatureAccess(state, feature);
  return state;
}

export async function requireCurrentUserBillingFeature(feature: BillingFeature) {
  const state = await getCurrentUserBillingState();
  assertBillingFeatureAccess(state, feature);
  return state;
}

export async function consumeBillingMeter(userId: string, meter: BillingMeter, amount = 1) {
  const state = await getBillingStateForUserId(userId);
  const limit =
    meter === "ai_generations"
      ? state.plan.limits.aiGenerationsPerMonth
      : state.plan.limits.apiRequestsPerMonth;

  if (limit !== null) {
    const used = await getUsageCount(userId, meter);
    if (used + amount > limit) {
      throw new BillingAccessError(
        meter === "ai_generations"
          ? `You have reached the ${limit}/month AI generation limit for the Free tier.`
          : `You have reached the ${limit.toLocaleString()}/month API request limit for the Creator tier.`,
        {
          status: 429,
          code: "usage_limit_reached",
          requiredTier: meter === "api_requests" ? "growth" : "creator",
        },
      );
    }
  }

  return incrementUsageCount(userId, meter, amount);
}

export async function ensureQrMutationAllowed(userId: string, input: {
  data?: { type?: string } | null;
  customDomainId?: string | null;
}) {
  const state = await getBillingStateForUserId(userId);

  if (input.data?.type === "file") {
    assertBillingFeatureAccess(state, "file_uploads");
  }

  if (input.customDomainId) {
    assertBillingFeatureAccess(state, "custom_domains");
  }

  return state;
}

export async function getAnalyticsHistoryWindowDaysForUser(userId: string) {
  const state = await getBillingStateForUserId(userId);
  return state.plan.limits.analyticsHistoryDays;
}

export async function hasAdvancedAnalyticsForUser(userId: string) {
  const state = await getBillingStateForUserId(userId);
  return state.plan.access.advanced_analytics;
}

export async function ensureStripeCustomerForUser(user: Pick<ServerUser, "id" | "primaryEmail" | "displayName" | "serverMetadata" | "update">) {
  const stored = getStoredBillingMetadata(user.serverMetadata);
  if (stored.stripeCustomerId) {
    return stored.stripeCustomerId;
  }

  const customer = await getStripe().customers.create({
    email: user.primaryEmail ?? undefined,
    name: user.displayName ?? undefined,
    metadata: {
      stackUserId: user.id,
    },
  });

  await user.update({
    serverMetadata: buildBillingMetadataUpdate(user.serverMetadata, {
      stripeCustomerId: customer.id,
    }),
  });

  return customer.id;
}

export async function syncStripeSubscriptionToUser(
  user: Pick<ServerUser, "serverMetadata" | "update">,
  subscription: StripeSubscriptionSnapshot | null,
) {
  await user.update({
    serverMetadata: buildBillingMetadataUpdate(user.serverMetadata, {
      stripeSubscription: subscription,
    }),
  });
}

export async function getStripeCheckoutPlanCatalog() {
  const stripe = getStripe();
  const entries = await Promise.all(
    PAID_BILLING_TIERS.map(async (tier) => {
      const priceId = await getStripePriceIdForTier(tier);
      const price = await stripe.prices.retrieve(priceId);
      return [tier, {
        priceId,
        amount: price.unit_amount ?? BILLING_PLANS[tier].priceCents,
        currency: price.currency ?? "usd",
        interval: price.recurring?.interval ?? "month",
      }] as const;
    }),
  );

  return Object.fromEntries(entries) as Record<Exclude<BillingTier, "free">, {
    priceId: string;
    amount: number | null;
    currency: string;
    interval: string;
  }>;
}

export async function listUsersByEmailQuery(query: string) {
  return stackAdminApp.listUsers({
    query,
    limit: 20,
  });
}

export async function findUserByPrimaryEmail(email: string) {
  const users = await listUsersByEmailQuery(email);
  return users.find((user) => user.primaryEmail?.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function createOrUpdateUserBillingAccess(input: {
  email: string;
  password: string;
  displayName?: string;
  tier: BillingTier;
}) {
  const existingUser = await findUserByPrimaryEmail(input.email);

  const user = existingUser ?? await stackAdminApp.createUser({
    primaryEmail: input.email,
    primaryEmailVerified: true,
    primaryEmailAuthEnabled: true,
    password: input.password,
    displayName: input.displayName ?? input.email.split("@")[0],
  });

  await user.update({
    displayName: input.displayName ?? user.displayName ?? input.email.split("@")[0],
    serverMetadata: buildBillingMetadataUpdate(user.serverMetadata, {
      accessOverrideTier: input.tier,
    }),
  });

  return user;
}
