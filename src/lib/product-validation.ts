import { z } from "zod";

function isSafeProductAssetUrl(value: string): boolean {
  if (value === "" || value.startsWith("/product-images/")) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" || (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname));
  } catch {
    return false;
  }
}

function isHttpUrl(value: string): boolean {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

const productAssetUrlSchema = z.string().trim().max(2048).refine(isSafeProductAssetUrl, "Asset URL must use https or /product-images/");
const websiteUrlSchema = z.string().trim().max(2048).refine((value) => value === "" || isHttpUrl(value), "Website URL must use http or https");
const expirySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}, "Expiry must be a real calendar date");

const productBenefitSchema = z.object({
  icon: z.string().trim().max(80).nullable().optional(),
  title: z.string().trim().max(120),
  subtitle: z.string().trim().max(240).nullable().optional(),
});

const nutritionFactValueSchema = z.string().trim().max(120).nullable().optional();
const productNutritionFactsSchema = z.object({
  servingSize: nutritionFactValueSchema,
  servingsPerContainer: nutritionFactValueSchema,
  calories: nutritionFactValueSchema,
  totalFat: nutritionFactValueSchema,
  totalFatDailyValue: nutritionFactValueSchema,
  saturatedFat: nutritionFactValueSchema,
  saturatedFatDailyValue: nutritionFactValueSchema,
  transFat: nutritionFactValueSchema,
  cholesterol: nutritionFactValueSchema,
  cholesterolDailyValue: nutritionFactValueSchema,
  sodium: nutritionFactValueSchema,
  sodiumDailyValue: nutritionFactValueSchema,
  totalCarbohydrate: nutritionFactValueSchema,
  totalCarbohydrateDailyValue: nutritionFactValueSchema,
  dietaryFiber: nutritionFactValueSchema,
  dietaryFiberDailyValue: nutritionFactValueSchema,
  totalSugars: nutritionFactValueSchema,
  addedSugars: nutritionFactValueSchema,
  addedSugarsDailyValue: nutritionFactValueSchema,
  protein: nutritionFactValueSchema,
  proteinDailyValue: nutritionFactValueSchema,
  vitaminD: nutritionFactValueSchema,
  vitaminDDailyValue: nutritionFactValueSchema,
  calcium: nutritionFactValueSchema,
  calciumDailyValue: nutritionFactValueSchema,
  iron: nutritionFactValueSchema,
  ironDailyValue: nutritionFactValueSchema,
  potassium: nutritionFactValueSchema,
  potassiumDailyValue: nutritionFactValueSchema,
  footnote: z.string().trim().max(500).nullable().optional(),
});

const productContentSchema = z.object({
  description: z.string().trim().max(5000).nullable().optional(),
  imageUrl: productAssetUrlSchema.nullable().optional(),
  imageAlt: z.string().trim().max(160).nullable().optional(),
  benefitItems: z.array(productBenefitSchema).max(8).nullable().optional(),
  ingredients: z.string().trim().max(5000).nullable().optional(),
  allergens: z.string().trim().max(5000).nullable().optional(),
  nutritionFacts: productNutritionFactsSchema.nullable().optional(),
  nutrition: z.string().trim().max(5000).nullable().optional(),
  instructions: z.string().trim().max(5000).nullable().optional(),
  certifications: z.string().trim().max(5000).nullable().optional(),
  origin: z.string().trim().max(5000).nullable().optional(),
  sustainability: z.string().trim().max(5000).nullable().optional(),
  promotion: z.string().trim().max(5000).nullable().optional(),
}).nullable().optional();

const productQualifiersSchema = z.object({
  batchLot: z.string().trim().max(20).nullable().optional(),
  serial: z.string().trim().max(20).nullable().optional(),
  expiry: expirySchema.nullable().optional(),
}).nullable().optional();

const productPageStyleSchema = z.object({
  brandName: z.string().trim().max(120).nullable().optional(),
  logoKey: z.string().trim().max(512).nullable().optional(),
  logoUrl: productAssetUrlSchema.nullable().optional(),
  websiteUrl: websiteUrlSchema.nullable().optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  cardColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  textColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
}).nullable().optional();

const marketRoutesSchema = z.array(z.object({
  countryCode: z.string().regex(/^[A-Za-z]{2}$/),
  url: z.string().url(),
})).max(50).optional();

export const productCreateSchema = z.object({
  name: z.string().trim().min(1).max(160),
  identifierSubmitted: z.string().max(80),
  destinationUrl: z.string().trim().max(2048).nullable().optional(),
  hostedExperience: z.boolean().optional(),
  content: productContentSchema,
  qualifiers: productQualifiersSchema,
  pageStyle: productPageStyleSchema,
  marketRoutes: marketRoutesSchema,
  customDomainId: z.string().uuid().nullable().optional(),
});

export const productUpdateSchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  destinationUrl: z.string().trim().max(2048).nullable().optional(),
  hostedExperience: z.boolean().optional(),
  content: productContentSchema,
  pageStyle: productPageStyleSchema,
}).refine((value) => Object.keys(value).length > 0, "At least one field must be provided");

export const productImportRowSchema = z.object({
  row: z.number().int().min(1),
  name: z.string().trim().max(160).optional().default(""),
  identifierSubmitted: z.string().min(1).max(80),
  destinationUrl: z.string().trim().max(2048).nullable().optional(),
  hostedExperience: z.boolean().optional(),
  content: productContentSchema,
  qualifiers: productQualifiersSchema,
  marketRoutes: marketRoutesSchema,
});

export const productImportSchema = z.object({
  rows: z.array(productImportRowSchema).min(1).max(500),
  customDomainId: z.string().uuid().nullable().optional(),
});
