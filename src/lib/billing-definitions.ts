export type BillingTier = "free" | "creator" | "growth";

export type BillingFeature =
  | "file_uploads"
  | "custom_domains"
  | "api_access"
  | "advanced_analytics";

export type BillingMeter = "ai_generations" | "api_requests";

export interface BillingPlanConfig {
  tier: BillingTier;
  label: string;
  shortLabel: string;
  headline: string;
  priceLabel: string;
  priceCents: number | null;
  paid: boolean;
  ctaLabel: string;
  features: string[];
  access: Record<BillingFeature, boolean>;
  limits: {
    aiGenerationsPerMonth: number | null;
    apiRequestsPerMonth: number | null;
    analyticsHistoryDays: number | null;
    teamSeats: number;
  };
}

export const BILLING_PLANS: Record<BillingTier, BillingPlanConfig> = {
  free: {
    tier: "free",
    label: "Free",
    shortLabel: "Free",
    headline: "Core QR creation with limited AI and basic analytics",
    priceLabel: "$0/mo",
    priceCents: null,
    paid: false,
    ctaLabel: "Current plan",
    features: [
      "Unlimited QR codes",
      "PNG and SVG downloads",
      "Up to 10 AI-generated QR codes per month",
      "30 days of scan history",
    ],
    access: {
      file_uploads: false,
      custom_domains: false,
      api_access: false,
      advanced_analytics: false,
    },
    limits: {
      aiGenerationsPerMonth: 10,
      apiRequestsPerMonth: 0,
      analyticsHistoryDays: 30,
      teamSeats: 1,
    },
  },
  creator: {
    tier: "creator",
    label: "Creator",
    shortLabel: "Creator",
    headline: "Uploads, custom domains, API access, and extended analytics history",
    priceLabel: "$4.99/mo",
    priceCents: 499,
    paid: true,
    ctaLabel: "Upgrade to Creator",
    features: [
      "Unlimited AI-generated QR codes",
      "Image and file uploads",
      "Custom domains",
      "API access up to 5,000 requests per month",
      "180 days of analytics history",
      "Top locations and extended dashboard analytics",
    ],
    access: {
      file_uploads: true,
      custom_domains: true,
      api_access: true,
      advanced_analytics: true,
    },
    limits: {
      aiGenerationsPerMonth: null,
      apiRequestsPerMonth: 5000,
      analyticsHistoryDays: 180,
      teamSeats: 3,
    },
  },
  growth: {
    tier: "growth",
    label: "Growth",
    shortLabel: "Growth",
    headline: "Full access with unlimited API usage and full analytics retention",
    priceLabel: "$9.99/mo",
    priceCents: 999,
    paid: true,
    ctaLabel: "Upgrade to Growth",
    features: [
      "Everything in Creator",
      "Unlimited API requests",
      "Unlimited analytics history",
      "Highest feature tier for the current product",
    ],
    access: {
      file_uploads: true,
      custom_domains: true,
      api_access: true,
      advanced_analytics: true,
    },
    limits: {
      aiGenerationsPerMonth: null,
      apiRequestsPerMonth: null,
      analyticsHistoryDays: null,
      teamSeats: 10,
    },
  },
};

export const PAID_BILLING_TIERS: Array<Exclude<BillingTier, "free">> = ["creator", "growth"];

export function getBillingPlanConfig(tier: BillingTier): BillingPlanConfig {
  return BILLING_PLANS[tier];
}

export function tierSupportsFeature(tier: BillingTier, feature: BillingFeature) {
  return BILLING_PLANS[tier].access[feature];
}

export function getRequiredTierForFeature(feature: BillingFeature): BillingTier {
  switch (feature) {
    case "file_uploads":
    case "custom_domains":
    case "api_access":
    case "advanced_analytics":
      return "creator";
  }
}
