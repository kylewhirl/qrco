import type { ProductNutritionFacts } from "@/lib/types";

export const nutritionFactKeys = [
  "servingSize",
  "servingsPerContainer",
  "calories",
  "totalFat",
  "totalFatDailyValue",
  "saturatedFat",
  "saturatedFatDailyValue",
  "transFat",
  "cholesterol",
  "cholesterolDailyValue",
  "sodium",
  "sodiumDailyValue",
  "totalCarbohydrate",
  "totalCarbohydrateDailyValue",
  "dietaryFiber",
  "dietaryFiberDailyValue",
  "totalSugars",
  "addedSugars",
  "addedSugarsDailyValue",
  "protein",
  "proteinDailyValue",
  "vitaminD",
  "vitaminDDailyValue",
  "calcium",
  "calciumDailyValue",
  "iron",
  "ironDailyValue",
  "potassium",
  "potassiumDailyValue",
  "footnote",
] as const satisfies ReadonlyArray<keyof ProductNutritionFacts>;

export function normalizeProductNutritionFacts(
  facts: ProductNutritionFacts | null | undefined,
): ProductNutritionFacts | null {
  if (!facts || typeof facts !== "object" || Array.isArray(facts)) {
    return null;
  }

  const normalized: ProductNutritionFacts = {};
  for (const key of nutritionFactKeys) {
    const value = facts[key];
    if (typeof value === "string" && value.trim()) {
      normalized[key] = value.trim().slice(0, key === "footnote" ? 500 : 120);
    }
  }

  return Object.keys(normalized).length ? normalized : null;
}
