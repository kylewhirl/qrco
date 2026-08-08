import { z } from "zod";

function hasHttpProtocol(value: string): boolean {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

const baseMetaSchema = z.object({
  name: z.string().trim().min(1).max(120).optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
  imageKey: z.string().trim().min(1).optional().nullable(),
});

const urlSchema = z.object({
  type: z.literal("url"),
  url: z.string().url(),
});

const gtinSchema = z
  .string()
  .trim()
  .regex(/^\d{8}$|^\d{12}$|^\d{13}$|^\d{14}$/, "GTIN must contain 8, 12, 13, or 14 digits")
  .refine((value) => {
    const digits = [...value].map(Number);
    const checkDigit = digits.pop();
    const sum = digits
      .reverse()
      .reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 3 : 1), 0);

    return checkDigit !== undefined && (10 - (sum % 10)) % 10 === checkDigit;
  }, "GTIN check digit is invalid");

const gs1PathAttributeSchema = z
  .string()
  .trim()
  .min(1)
  .max(20)
  .refine((value) => !/[/?#\u0000-\u001F\u007F]/u.test(value), "Value cannot contain URL path separators")
  .optional()
  .nullable();

const gs1MarketRouteSchema = z.object({
  countryCode: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{2}$/, "Market must be a two-letter country code")
    .transform((value) => value.toUpperCase()),
  url: z
    .string()
    .url()
    .refine(hasHttpProtocol, "Market destination must use http or https"),
});

const gs1DigitalLinkSchema = z.object({
  gtin: gtinSchema,
  productName: z.string().trim().min(1).max(160).optional().nullable(),
  batchLot: gs1PathAttributeSchema,
  serial: gs1PathAttributeSchema,
  expiry: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Expiry date must use YYYY-MM-DD")
    .optional()
    .nullable(),
  marketRoutes: z.array(gs1MarketRouteSchema).max(50).optional().default([]),
}).superRefine((value, context) => {
  const seen = new Set<string>();
  value.marketRoutes.forEach((route, index) => {
    if (seen.has(route.countryCode)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Only one destination can be configured for ${route.countryCode}`,
        path: ["marketRoutes", index, "countryCode"],
      });
    }
    seen.add(route.countryCode);
  });
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

const contactFieldsSchema = z
  .object({
    type: z.literal("contact"),
    source: z.literal("fields"),
    firstName: z.string().trim().max(120).optional().nullable(),
    lastName: z.string().trim().max(120).optional().nullable(),
    organization: z.string().trim().max(160).optional().nullable(),
    title: z.string().trim().max(160).optional().nullable(),
    phone: z.string().trim().max(40).optional().nullable(),
    email: z.string().trim().email().max(160).optional().nullable(),
    website: z.string().trim().url().max(2048).optional().nullable(),
    address: z.string().trim().max(500).optional().nullable(),
    note: z.string().trim().max(500).optional().nullable(),
  })
  .refine(
    (value) =>
      Boolean(
        value.firstName ||
          value.lastName ||
          value.organization ||
          value.phone ||
          value.email ||
          value.website ||
          value.address ||
          value.note,
      ),
    {
      message: "At least one contact field is required",
    },
  );

const contactVCardSchema = z
  .object({
    type: z.literal("contact"),
    source: z.literal("vcard"),
    vcard: z.string().trim().min(1),
    fileName: z.string().trim().min(1).max(255).optional().nullable(),
  })
  .refine(
    (value) => /BEGIN:VCARD/i.test(value.vcard) && /END:VCARD/i.test(value.vcard),
    {
      message: "Uploaded contact files must contain a valid VCARD payload",
      path: ["vcard"],
    },
  );

const wifiSchema = z.object({
  type: z.literal("wifi"),
  ssid: z.string().trim().min(1),
  authenticationType: z.string().trim().min(1),
  password: z.string().optional(),
  hidden: z.boolean().optional(),
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

export const qrTypeDefaultsSchema = z.object({
  url: qrRenderConfigSchema.optional(),
  file: qrRenderConfigSchema.optional(),
  text: qrRenderConfigSchema.optional(),
  email: qrRenderConfigSchema.optional(),
  phone: qrRenderConfigSchema.optional(),
  sms: qrRenderConfigSchema.optional(),
  contact: qrRenderConfigSchema.optional(),
  wifi: qrRenderConfigSchema.optional(),
});

const qrDataMetaSchema = baseMetaSchema.extend({
  errorLevel: z.enum(["L", "M", "Q", "H"]).optional(),
  styleSettings: qrStyleSettingsSchema.nullable().optional(),
  logoSettings: qrLogoSettingsSchema.nullable().optional(),
  borderSettings: qrBorderSettingsSchema.nullable().optional(),
  gs1: gs1DigitalLinkSchema.nullable().optional(),
});

export const qrDataSchema = z
  .intersection(
    z.union([urlSchema, fileSchema, textSchema, emailSchema, phoneSchema, smsSchema, contactFieldsSchema, contactVCardSchema, wifiSchema]),
    qrDataMetaSchema,
  )
  .superRefine((value, context) => {
    if (!value.gs1) {
      return;
    }

    if (value.type !== "url") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "GS1 Digital Link records must use a web URL destination",
        path: ["type"],
      });
      return;
    }

    if (!hasHttpProtocol(value.url)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "GS1 Digital Link destinations must use http or https",
        path: ["url"],
      });
    }
  });

const hexColorSchema = z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Use a six-digit hex color");
const brandAssetUrlSchema = z.string().trim().max(2048).refine((value) => {
  if (value.startsWith("/")) {
    return value.startsWith("/product-images/");
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" || (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname));
  } catch {
    return false;
  }
}, "Logo URL must use https (or a local development URL)");
const brandWebsiteUrlSchema = z.string().url().max(2048).refine((value) => {
  const protocol = new URL(value).protocol;
  return protocol === "https:" || protocol === "http:";
}, "Website URL must use http or https");

export const brandProfileSchema = z.object({
  brandName: z.string().trim().min(1).max(120),
  logoUrl: brandAssetUrlSchema.nullable().optional(),
  websiteUrl: brandWebsiteUrlSchema.nullable().optional(),
  primaryColor: hexColorSchema,
  accentColor: hexColorSchema,
  backgroundColor: hexColorSchema,
  cardColor: hexColorSchema.nullable().optional(),
  textColor: hexColorSchema.nullable().optional(),
  defaultConfig: qrRenderConfigSchema,
  typeDefaults: qrTypeDefaultsSchema.optional(),
});

export const stylePresetQrTypeSchema = z.enum([
  "all",
  "url",
  "file",
  "text",
  "email",
  "phone",
  "sms",
  "contact",
  "wifi",
]);

export const stylePresetCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(240).nullable().optional(),
  qrType: stylePresetQrTypeSchema.default("all"),
  isDefault: z.boolean().optional(),
  config: qrRenderConfigSchema,
});

export const stylePresetUpdateSchema = stylePresetCreateSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field must be provided",
);

export const qrMutationSchema = z.object({
  data: qrDataSchema,
  customDomainId: z.string().uuid().nullable().optional(),
  customSlug: z.preprocess((value) => {
    if (typeof value !== "string") {
      return value;
    }

    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }, z.string()
    .min(1)
    .max(120)
    .refine((value) => !/[/?#\u0000-\u001F\u007F]/u.test(value), "Custom slug must be one URL path segment")
    .nullable()
    .optional()),
});

export const qrMutationRequestSchema = z.union([
  qrDataSchema.transform((data) => ({ data, customDomainId: null, customSlug: null })),
  qrMutationSchema.transform((payload) => ({
    data: payload.data,
    customDomainId: payload.customDomainId ?? null,
    customSlug: payload.customSlug ?? null,
  })),
]);

export interface QrStyleSettings {
  dotStyle?: "square" | "dots" | "rounded" | "extra-rounded" | "classy" | "classy-rounded";
  dotColorType?: "solid" | "gradient";
  dotColors?: string[];
  dotGradientType?: "linear" | "radial";
  dotRotation?: number;
  eyeStyle?: "square" | "dots" | "rounded" | "extra-rounded" | "classy" | "classy-rounded" | "dot";
  eyeColorType?: "solid" | "gradient";
  eyeColors?: string[];
  eyeGradientType?: "linear" | "radial";
  eyeRotation?: number;
  innerEyeStyle?: "none" | "square" | "dots" | "rounded" | "extra-rounded" | "classy" | "classy-rounded" | "dot";
  innerEyeColorType?: "solid" | "gradient";
  innerEyeColors?: string[];
  innerEyeGradientType?: "linear" | "radial";
  innerEyeRotation?: number;
  bgColorType?: "solid" | "gradient";
  bgColors?: string[];
  bgGradientType?: "linear" | "radial";
  bgRotation?: number;
}

export interface QrLogoSettings {
  src: string;
  size: number;
  margin?: number;
  hideBackgroundDots?: boolean;
}

export interface QrBorderSettings {
  shape: "square" | "circle";
  colorType: "solid" | "gradient";
  colors: string[];
  gradientType: "linear" | "radial";
  rotation: number;
  preset: string;
  text: string;
  textStyle?: string;
}

export interface QrRenderConfig {
  errorLevel: "L" | "M" | "Q" | "H";
  width?: number;
  height?: number;
  margin?: number;
  styleSettings?: QrStyleSettings | null;
  logoSettings?: QrLogoSettings | null;
  borderSettings?: QrBorderSettings | null;
}

export interface QRMeta {
  name?: string | null;
  description?: string | null;
  imageKey?: string | null;
  errorLevel?: "L" | "M" | "Q" | "H";
  styleSettings?: QrStyleSettings | null;
  logoSettings?: QrLogoSettings | null;
  borderSettings?: QrBorderSettings | null;
  gs1?: Gs1DigitalLinkAttributes | null;
}

export interface Gs1DigitalLinkAttributes {
  gtin: string;
  productName?: string | null;
  batchLot?: string | null;
  serial?: string | null;
  expiry?: string | null;
  marketRoutes?: Gs1MarketRoute[];
}

export interface Gs1MarketRoute {
  countryCode: string;
  url: string;
}

export interface URLData {
  type: "url";
  url: string;
}

export interface FileData {
  type: "file";
  key: string;
}

export interface TextData {
  type: "text";
  text: string;
}

export interface EmailData {
  type: "email";
  to: string;
  subject: string;
  body: string;
}

export interface PhoneData {
  type: "phone";
  number: string;
}

export interface SMSData {
  type: "sms";
  number: string;
  message: string;
}

export interface ContactFieldsData {
  type: "contact";
  source: "fields";
  firstName?: string | null;
  lastName?: string | null;
  organization?: string | null;
  title?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  note?: string | null;
}

export interface ContactVCardData {
  type: "contact";
  source: "vcard";
  vcard: string;
  fileName?: string | null;
}

export type ContactData = ContactFieldsData | ContactVCardData;

export interface WiFiData {
  type: "wifi";
  ssid: string;
  authenticationType: "WEP" | "WPA" | "nopass" | string;
  password?: string;
  hidden?: boolean;
}

export type QRData =
  | (URLData & QRMeta)
  | (FileData & QRMeta)
  | (TextData & QRMeta)
  | (EmailData & QRMeta)
  | (PhoneData & QRMeta)
  | (SMSData & QRMeta)
  | (ContactData & QRMeta)
  | (WiFiData & QRMeta);

export interface QR {
  id: string;
  code: string;
  data: QRData;
  customDomainId: string | null;
  customHostname?: string | null;
  publicUrl?: string;
  imageUrl?: string | null;
  createdAt: string | Date;
  totalScans: number;
  lastScanned: string | Date | null;
}

export interface CustomDomainSummary {
  id: string;
  hostname: string;
  status: string;
  isPrimary: boolean;
}

export interface BrandProfile {
  id: string;
  userId: string;
  brandName: string;
  logoUrl: string | null;
  websiteUrl?: string | null;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  cardColor?: string | null;
  textColor?: string | null;
  defaultConfig: QrRenderConfig;
  typeDefaults?: QrTypeDefaults;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface QrTypeDefaults {
  url?: QrRenderConfig;
  file?: QrRenderConfig;
  text?: QrRenderConfig;
  email?: QrRenderConfig;
  phone?: QrRenderConfig;
  sms?: QrRenderConfig;
  contact?: QrRenderConfig;
  wifi?: QrRenderConfig;
}

export interface StylePreset {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  qrType: "all" | QRData["type"];
  isDefault: boolean;
  config: QrRenderConfig;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export type StylePresetQrType = StylePreset["qrType"];

export interface DashboardMetrics {
  totalScansLast7Days: number;
  activeQRCodesCount: number;
  topLocation: {
    location: string;
    count: number;
  } | null;
  mostActiveQR: {
    code: string;
    data: QRData;
    scans: number;
  } | null;
}

export interface DailyScanCount {
  date: string;
  count: number;
}

export interface TopLocation {
  location: string;
  count: number;
}

export interface LatestScan {
  id: number;
  code: string;
  scannedAt: string | Date;
  location: string | null;
  data: QRData;
}

export interface AnalyticsSummary {
  metrics: DashboardMetrics;
  dailyScans: DailyScanCount[];
  topLocations: TopLocation[];
}
