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
