import type { ProductNutritionFacts } from "@/lib/types";

type ProductNutritionLabelProps = {
  facts: ProductNutritionFacts;
  primaryColor: string;
  cardColor: string;
  textColor: string;
};

type NutritionRow = {
  key: keyof ProductNutritionFacts;
  label: string;
  dailyValueKey?: keyof ProductNutritionFacts;
  indent?: boolean;
  strong?: boolean;
};

const nutritionRows: NutritionRow[] = [
  { key: "totalFat", label: "Total Fat", dailyValueKey: "totalFatDailyValue", strong: true },
  { key: "saturatedFat", label: "Saturated Fat", dailyValueKey: "saturatedFatDailyValue", indent: true },
  { key: "transFat", label: "Trans Fat", indent: true },
  { key: "cholesterol", label: "Cholesterol", dailyValueKey: "cholesterolDailyValue", strong: true },
  { key: "sodium", label: "Sodium", dailyValueKey: "sodiumDailyValue", strong: true },
  { key: "totalCarbohydrate", label: "Total Carbohydrate", dailyValueKey: "totalCarbohydrateDailyValue", strong: true },
  { key: "dietaryFiber", label: "Dietary Fiber", dailyValueKey: "dietaryFiberDailyValue", indent: true },
  { key: "totalSugars", label: "Total Sugars", indent: true },
  { key: "addedSugars", label: "Includes Added Sugars", dailyValueKey: "addedSugarsDailyValue", indent: true },
  { key: "protein", label: "Protein", dailyValueKey: "proteinDailyValue", strong: true },
  { key: "vitaminD", label: "Vitamin D", dailyValueKey: "vitaminDDailyValue" },
  { key: "calcium", label: "Calcium", dailyValueKey: "calciumDailyValue" },
  { key: "iron", label: "Iron", dailyValueKey: "ironDailyValue" },
  { key: "potassium", label: "Potassium", dailyValueKey: "potassiumDailyValue" },
];

function valueOrDash(value: string | null | undefined) {
  return value?.trim() || "—";
}

export function ProductNutritionLabel({ facts, primaryColor, cardColor, textColor }: ProductNutritionLabelProps) {
  const hasAnyNutrient = nutritionRows.some(({ key, dailyValueKey }) => facts[key] || (dailyValueKey && facts[dailyValueKey]));

  return (
    <section className="w-full max-w-[34rem] overflow-hidden rounded-2xl border shadow-sm" style={{ backgroundColor: cardColor, borderColor: `${primaryColor}20`, color: textColor }} aria-label="Nutrition Facts">
      <div className="flex flex-col gap-4 border-b px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5" style={{ backgroundColor: `${primaryColor}08`, borderColor: `${primaryColor}18` }}>
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em]" style={{ color: primaryColor }}>Nutrition</p>
          <h3 className="mt-1 text-2xl font-extrabold tracking-[-0.045em] sm:text-3xl">Nutrition Facts</h3>
          <p className="mt-1 text-xs opacity-65">Clear serving information at a glance</p>
        </div>
        <div className="shrink-0 rounded-xl border px-4 py-3 sm:min-w-28" style={{ backgroundColor: cardColor, borderColor: `${primaryColor}22` }}>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] opacity-65">Calories</p>
          <p className="mt-1 text-3xl font-black leading-none tracking-[-0.05em]">{valueOrDash(facts.calories)}</p>
          <p className="mt-1 text-[11px] opacity-65">per serving</p>
        </div>
      </div>

      <div className="grid gap-2 border-b px-4 py-4 sm:grid-cols-2 sm:px-5" style={{ borderColor: `${primaryColor}18` }}>
        <div className="rounded-xl border px-3 py-2.5" style={{ backgroundColor: `${primaryColor}06`, borderColor: `${primaryColor}16` }}>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] opacity-60">Serving size</p>
          <p className="mt-1 text-sm font-bold">{valueOrDash(facts.servingSize)}</p>
        </div>
        <div className="rounded-xl border px-3 py-2.5" style={{ backgroundColor: `${primaryColor}06`, borderColor: `${primaryColor}16` }}>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] opacity-60">Servings per container</p>
          <p className="mt-1 text-sm font-bold">{valueOrDash(facts.servingsPerContainer)}</p>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em]" style={{ color: primaryColor }}>Amounts per serving</p>
            <p className="mt-1 text-xs opacity-60">Nutrient details</p>
          </div>
          <span className="rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em]" style={{ backgroundColor: `${primaryColor}12`, color: primaryColor }}>% Daily Value*</span>
        </div>

        {hasAnyNutrient ? (
          <div className="mt-3 overflow-hidden rounded-xl border" style={{ borderColor: `${primaryColor}18` }}>
            {nutritionRows.map(({ key, label, dailyValueKey, indent, strong }) => {
              const amount = facts[key];
              const dailyValue = dailyValueKey ? facts[dailyValueKey] : null;
              if (!amount && !dailyValue) return null;
              return (
                <div key={key} className={`flex items-center justify-between gap-4 border-t px-3 py-3 first:border-t-0 sm:px-4 ${indent ? "pl-6 sm:pl-8" : ""}`} style={{ borderColor: `${primaryColor}14` }}>
                  <span className={`min-w-0 text-sm ${strong ? "font-bold" : "opacity-80"}`}>{label}</span>
                  <span className="flex shrink-0 items-center gap-2 text-right">
                    <span className="text-sm">{valueOrDash(amount)}</span>
                    {dailyValue ? <span className="rounded-full px-2 py-1 text-[11px] font-bold" style={{ backgroundColor: `${primaryColor}12`, color: primaryColor }}>{dailyValue}</span> : null}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-3 rounded-xl border border-dashed px-4 py-5 text-sm opacity-70" style={{ borderColor: `${primaryColor}28` }}>Nutrient values have not been provided yet.</p>
        )}
      </div>

      <div className="border-t px-4 py-3 sm:px-5" style={{ backgroundColor: `${primaryColor}04`, borderColor: `${primaryColor}18` }}>
        <p className="text-[11px] leading-5 opacity-70">* The % Daily Value tells you how much a nutrient in a serving contributes to a daily diet. 2,000 calories a day is used for general nutrition advice.</p>
        {facts.footnote ? <p className="mt-2 whitespace-pre-line break-words text-[11px] leading-5 opacity-70">{facts.footnote}</p> : null}
      </div>
    </section>
  );
}
