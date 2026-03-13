import { z } from "zod";

const baseMetaSchema = z.object({
  name: z.string().trim().min(1).max(120).optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
});

const urlSchema = z.object({
  type: z.literal("url"),
  url: z.string().url(),
});

const fileSchema = z.object({
  type: z.literal("file"),
  key: z.string().trim().min(1),
});

const textSchema = z.object({
  type: z.literal("text"),
  text: z.string().trim().min(1),
});

const emailSchema = z.object({
  type: z.literal("email"),
  to: z.string().email(),
  subject: z.string().trim().min(1),
  body: z.string().trim().min(1),
});

const phoneSchema = z.object({
  type: z.literal("phone"),
  number: z.string().trim().min(1),
});

const smsSchema = z.object({
  type: z.literal("sms"),
  number: z.string().trim().min(1),
  message: z.string().trim().min(1),
});

const wifiSchema = z.object({
  type: z.literal("wifi"),
  ssid: z.string().trim().min(1),
  authenticationType: z.string().trim().min(1),
  password: z.string().optional(),
  hidden: z.boolean().optional(),
});

export const qrDataSchema = z.intersection(
  z.union([urlSchema, fileSchema, textSchema, emailSchema, phoneSchema, smsSchema, wifiSchema]),
  baseMetaSchema,
);

export const qrMutationSchema = z.object({
  data: qrDataSchema,
  customDomainId: z.string().uuid().nullable().optional(),
});

export const qrMutationRequestSchema = z.union([
  qrDataSchema.transform((data) => ({ data, customDomainId: null })),
  qrMutationSchema.transform((payload) => ({
    data: payload.data,
    customDomainId: payload.customDomainId ?? null,
  })),
]);

export const customDomainCreateSchema = z.object({
  hostname: z.string().trim().min(1).max(255),
});

export const createApiKeySchema = z.object({
  name: z.string().trim().min(1).max(80),
});

const colorArraySchema = z.array(z.string().trim().min(1)).min(1).max(2);

export const qrStyleSettingsSchema = z.object({
  dotStyle: z.enum(["square", "dots", "rounded", "extra-rounded", "classy", "classy-rounded"]).optional(),
  dotColorType: z.enum(["solid", "gradient"]).optional(),
  dotColors: colorArraySchema.optional(),
  dotGradientType: z.enum(["linear", "radial"]).optional(),
  dotRotation: z.number().min(0).max(360).optional(),
  eyeStyle: z.enum(["square", "dots", "rounded", "extra-rounded", "classy", "classy-rounded", "dot"]).optional(),
  eyeColorType: z.enum(["solid", "gradient"]).optional(),
  eyeColors: colorArraySchema.optional(),
  eyeGradientType: z.enum(["linear", "radial"]).optional(),
  eyeRotation: z.number().min(0).max(360).optional(),
  innerEyeStyle: z.enum(["none", "square", "dots", "rounded", "extra-rounded", "classy", "classy-rounded", "dot"]).optional(),
  innerEyeColorType: z.enum(["solid", "gradient"]).optional(),
  innerEyeColors: colorArraySchema.optional(),
  innerEyeGradientType: z.enum(["linear", "radial"]).optional(),
  innerEyeRotation: z.number().min(0).max(360).optional(),
  bgColorType: z.enum(["solid", "gradient"]).optional(),
  bgColors: colorArraySchema.optional(),
  bgGradientType: z.enum(["linear", "radial"]).optional(),
  bgRotation: z.number().min(0).max(360).optional(),
});

export const qrLogoSettingsSchema = z.object({
  src: z.string().trim().min(1),
  size: z.number().min(0.1).max(0.8),
  margin: z.number().min(0).max(64).optional(),
  hideBackgroundDots: z.boolean().optional(),
});

export const qrBorderSettingsSchema = z.object({
  shape: z.enum(["square", "circle"]),
  colorType: z.enum(["solid", "gradient"]),
  colors: colorArraySchema,
  gradientType: z.enum(["linear", "radial"]),
  rotation: z.number().min(0).max(360),
  preset: z.string().trim().min(1).max(80),
  text: z.string().max(120),
  textStyle: z.string().max(80).optional(),
});

export const qrRenderConfigSchema = z.object({
  errorLevel: z.enum(["L", "M", "Q", "H"]).default("M"),
  width: z.number().int().min(128).max(2048).optional(),
  height: z.number().int().min(128).max(2048).optional(),
  margin: z.number().int().min(0).max(128).optional(),
  styleSettings: qrStyleSettingsSchema.nullable().optional(),
  logoSettings: qrLogoSettingsSchema.nullable().optional(),
  borderSettings: qrBorderSettingsSchema.nullable().optional(),
});

export const brandProfileSchema = z.object({
  brandName: z.string().trim().min(1).max(120),
  logoUrl: z.string().url().nullable().optional(),
  primaryColor: z.string().trim().min(1).max(32),
  accentColor: z.string().trim().min(1).max(32),
  backgroundColor: z.string().trim().min(1).max(32),
  defaultConfig: qrRenderConfigSchema,
});

export const stylePresetCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(240).nullable().optional(),
  isDefault: z.boolean().optional(),
  config: qrRenderConfigSchema,
});

export const stylePresetUpdateSchema = stylePresetCreateSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field must be provided",
);
