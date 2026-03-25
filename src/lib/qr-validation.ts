import { z } from "zod";

export {
  brandProfileSchema,
  qrBorderSettingsSchema,
  qrDataSchema,
  qrLogoSettingsSchema,
  qrMutationRequestSchema,
  qrMutationSchema,
  qrRenderConfigSchema,
  qrStyleSettingsSchema,
  stylePresetCreateSchema,
  stylePresetUpdateSchema,
} from "tqrco/shared";

export const customDomainCreateSchema = z.object({
  hostname: z.string().trim().min(1).max(255),
});

export const customDomainFallbackSchema = z.object({
  fallbackUrl: z.preprocess((value) => {
    if (typeof value !== "string") {
      return value;
    }

    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }, z.union([
    z.string().url().max(2048).transform((value, context) => {
      const url = new URL(value);
      if (!["http:", "https:"].includes(url.protocol)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Fallback URL must use http or https",
        });
        return z.NEVER;
      }

      return url.toString();
    }),
    z.null(),
  ])),
});

export const createApiKeySchema = z.object({
  name: z.string().trim().min(1).max(80),
});

export const apiAccessScopeSchema = z.enum([
  "qr:read",
  "qr:write",
  "analytics:read",
  "brand:read",
  "brand:write",
  "styles:read",
  "styles:write",
]);

const originSchema = z
  .string()
  .trim()
  .url()
  .transform((value) => {
    const url = new URL(value);
    return url.origin;
  });

export const createPublishableTokenSchema = z.object({
  name: z.string().trim().min(1).max(80),
  scopes: z.array(apiAccessScopeSchema).min(1).max(7),
  allowedOrigins: z.array(originSchema).min(1).max(20),
});

export const updateApiAccessTokenSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  scopes: z.array(apiAccessScopeSchema).min(1).max(7).optional(),
  allowedOrigins: z.array(originSchema).max(20).optional(),
}).refine(
  (value) => Object.keys(value).length > 0,
  "At least one field must be provided",
);
