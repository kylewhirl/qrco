import { z } from "zod";

const baseMetaSchema = z.object({
  name: z.string().trim().min(1).max(120).optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
  imageKey: z.string().trim().min(1).optional().nullable(),
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
});

export const qrDataSchema = z.intersection(
  z.union([urlSchema, fileSchema, textSchema, emailSchema, phoneSchema, smsSchema, contactFieldsSchema, contactVCardSchema, wifiSchema]),
  qrDataMetaSchema,
);

export const brandProfileSchema = z.object({
  brandName: z.string().trim().min(1).max(120),
  logoUrl: z.string().url().nullable().optional(),
  primaryColor: z.string().trim().min(1).max(32),
  accentColor: z.string().trim().min(1).max(32),
  backgroundColor: z.string().trim().min(1).max(32),
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
});

export const qrMutationRequestSchema = z.union([
  qrDataSchema.transform((data) => ({ data, customDomainId: null })),
  qrMutationSchema.transform((payload) => ({
    data: payload.data,
    customDomainId: payload.customDomainId ?? null,
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
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
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
