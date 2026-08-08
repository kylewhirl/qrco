import type { ProductBenefit, ProductContent } from "@/lib/types";

function normalizeBenefit(benefit: ProductBenefit | null | undefined): ProductBenefit | null {
  const title = benefit?.title?.trim();
  if (!title) {
    return null;
  }

  return {
    icon: benefit?.icon?.trim() || "sparkles",
    title: title.slice(0, 120),
    subtitle: (benefit?.subtitle ?? "").trim().slice(0, 240),
  };
}

export function normalizeProductBenefits(benefits: ProductContent["benefitItems"]): ProductBenefit[] {
  if (!Array.isArray(benefits)) return [];

  return benefits
    .map((benefit) => normalizeBenefit(benefit))
    .filter((benefit): benefit is ProductBenefit => Boolean(benefit))
    .slice(0, 8);
}
