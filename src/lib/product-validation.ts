import { z } from "zod";

const productContentSchema = z.object({
  description: z.string().trim().max(5000).nullable().optional(),
  imageUrl: z.string().trim().max(2048).nullable().optional(),
  imageKey: z.string().trim().max(512).nullable().optional(),
  imageAlt: z.string().trim().max(160).nullable().optional(),
  benefits: z.string().trim().max(2000).nullable().optional(),
  ingredients: z.string().trim().max(5000).nullable().optional(),
  allergens: z.string().trim().max(5000).nullable().optional(),
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
  expiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
}).nullable().optional();

const productPageStyleSchema = z.object({
  brandName: z.string().trim().max(120).nullable().optional(),
  logoUrl: z.string().trim().max(2048).nullable().optional(),
  websiteUrl: z.string().trim().max(2048).nullable().optional(),
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
