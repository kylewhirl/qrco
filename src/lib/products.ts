import "server-only";

import { randomUUID } from "node:crypto";

import { queryAdmin, queryNoAuth } from "@/lib/db";
import {
  buildGs1DigitalLinkPath,
  getGs1DigitalLinkUrlForQr,
  validateGtin,
} from "@/lib/gs1-digital-link";
import { ensureCustomDomainOwnedByUser } from "@/lib/custom-domains";
import {
  deleteQRForUser,
  getQRByIdForUser,
  prepareQRCodeCreationForUser,
} from "@/lib/qr-service";
import { ensureQrMutationAllowed } from "@/lib/billing";
import { isOwnedUploadObjectKey } from "@/lib/storage";
import { normalizeProductNutritionFacts } from "@/lib/product-nutrition";
import type {
  Product,
  ProductBenefit,
  ProductContent,
  ProductNutritionFacts,
  ProductQualifiers,
  QR,
  QRData,
} from "@/lib/types";
import type { ProductPageStyle } from "@/lib/types";
import { getPrimaryAppUrl, isPrimaryAppHost } from "@/lib/qr-url";

export type ProductCreateInput = {
  name: string;
  identifierSubmitted: string;
  destinationUrl?: string | null;
  hostedExperience?: boolean;
  content?: ProductContent | null;
  qualifiers?: ProductQualifiers | null;
  pageStyle?: ProductPageStyle | null;
  marketRoutes?: Array<{ countryCode: string; url: string }>;
  customDomainId?: string | null;
};

export type ProductUpdateInput = {
  name?: string;
  destinationUrl?: string | null;
  hostedExperience?: boolean;
  content?: ProductContent | null;
  pageStyle?: ProductPageStyle | null;
};

export class ProductValidationError extends Error {
  readonly status = 400;
  readonly code = "invalid_product";

  constructor(message: string) {
    super(message);
    this.name = "ProductValidationError";
  }
}

const contentKeys: Array<keyof ProductContent> = [
  "description",
  "imageUrl",
  "imageKey",
  "imageAlt",
  "benefitItems",
  "ingredients",
  "allergens",
  "nutritionFacts",
  "nutrition",
  "instructions",
  "certifications",
  "origin",
  "sustainability",
  "promotion",
];

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function isHttpUrl(value: string): boolean {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeProductAssetUrl(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.startsWith("/product-images/")) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const isLocalHost = ["localhost", "127.0.0.1"].includes(url.hostname);
    if (url.protocol !== "https:" && !(url.protocol === "http:" && isLocalHost)) {
      return null;
    }

    if (url.pathname.startsWith("/product-images/") && isPrimaryAppHost(url.hostname)) {
      return `${url.pathname}${url.search}`;
    }

    return trimmed;
  } catch {
    return null;
  }
}

function cleanContent(content: ProductContent | null | undefined, allowedImageKey?: string | null): ProductContent {
  const cleaned: ProductContent = {};

  for (const key of contentKeys) {
    const value = content?.[key];
    if (key === "benefitItems") {
      if (!Array.isArray(value)) {
        continue;
      }

      const cleanedBenefits: ProductBenefit[] = [];
      for (const item of value) {
        if (!item || typeof item !== "object") {
          continue;
        }

        const benefit = item as Partial<ProductBenefit>;
        const title = typeof benefit.title === "string" ? benefit.title.trim().slice(0, 120) : "";
        if (!title) {
          continue;
        }

        cleanedBenefits.push({
          icon: typeof benefit.icon === "string" ? benefit.icon.trim().slice(0, 80) || "sparkles" : "sparkles",
          title,
          subtitle: typeof benefit.subtitle === "string" ? benefit.subtitle.trim().slice(0, 240) : "",
        });
      }
      cleaned.benefitItems = cleanedBenefits.slice(0, 8);
      continue;
    }

    if (key === "nutritionFacts") {
      const normalizedFacts = normalizeProductNutritionFacts(value as ProductNutritionFacts | null | undefined);
      if (normalizedFacts) {
        cleaned.nutritionFacts = normalizedFacts;
      }
      continue;
    }

    if (typeof value === "string" && value.trim()) {
      if (key === "imageUrl") {
        const normalizedAssetUrl = normalizeProductAssetUrl(value);
        if (!normalizedAssetUrl) {
          continue;
        }
        cleaned[key] = normalizedAssetUrl.slice(0, 2048);
        continue;
      }
      if (key === "imageKey") {
        if (allowedImageKey && value.trim() === allowedImageKey) {
          cleaned[key] = allowedImageKey;
        }
        continue;
      }
      const maxLength = key === "imageAlt" ? 160 : 5000;
      cleaned[key] = value.trim().slice(0, maxLength);
    }
  }

  return cleaned;
}

function cleanQualifiers(qualifiers: ProductQualifiers | null | undefined): ProductQualifiers {
  return {
    batchLot: qualifiers?.batchLot?.trim() || null,
    serial: qualifiers?.serial?.trim() || null,
    expiry: qualifiers?.expiry || null,
  };
}

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

function cleanPageStyle(style: ProductPageStyle | null | undefined, allowedLogoKey?: string | null): ProductPageStyle {
  const cleaned: ProductPageStyle = {};
  const brandName = style?.brandName?.trim();
  const logoKey = style?.logoKey?.trim();
  const logoUrl = style?.logoUrl?.trim();
  const websiteUrl = style?.websiteUrl?.trim();

  if (brandName) {
    cleaned.brandName = brandName.slice(0, 120);
  }

  if (allowedLogoKey && logoKey === allowedLogoKey) {
    cleaned.logoKey = allowedLogoKey;
  }

  if (logoUrl === "") {
    cleaned.logoUrl = "";
  } else if (logoUrl) {
    const normalizedLogoUrl = normalizeProductAssetUrl(logoUrl);
    if (normalizedLogoUrl) {
      cleaned.logoUrl = normalizedLogoUrl.slice(0, 2048);
    }
  }

  if (websiteUrl === "") {
    cleaned.websiteUrl = "";
  } else if (websiteUrl && isHttpUrl(websiteUrl)) {
    cleaned.websiteUrl = websiteUrl.slice(0, 2048);
  }

  for (const key of ["primaryColor", "accentColor", "backgroundColor", "cardColor", "textColor"] as const) {
    const value = style?.[key]?.trim();
    if (value && HEX_COLOR.test(value)) {
      cleaned[key] = value;
    }
  }

  return cleaned;
}

function hostedProductUrl(productId: string): string {
  return getPrimaryAppUrl(`/product/${productId}`).toString();
}

type ProductRow = {
  id: string;
  user_id: string;
  name: string;
  identifierSubmitted: string;
  gtin: string;
  destinationUrl: string;
  hostedExperience: boolean;
  content: ProductContent | null;
  qualifiers: ProductQualifiers | null;
  pageStyle: ProductPageStyle | null;
  qrId: string;
  customDomainId: string | null;
  customHostname: string | null;
  totalScans: number;
  lastScanned: Date | string | null;
  publicQrCode: string;
  qrData: QRData;
  createdAt: Date | string;
  updatedAt: Date | string;
};

function mapProduct(row: ProductRow): Product {
  const qr: QR = {
    id: row.qrId,
    code: row.publicQrCode,
    data: row.qrData,
    customDomainId: row.customDomainId,
    customHostname: row.customHostname,
    publicUrl: getGs1DigitalLinkUrlForQr(row.qrData, row.customHostname) ?? undefined,
    createdAt: row.createdAt,
    totalScans: Number(row.totalScans || 0),
    lastScanned: row.lastScanned,
  };

  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    identifierSubmitted: row.identifierSubmitted,
    gtin: row.gtin,
    destinationUrl: row.destinationUrl,
    hostedExperience: Boolean(row.hostedExperience),
    content: row.content ?? {},
    qualifiers: row.qualifiers ?? {},
    pageStyle: row.pageStyle ?? {},
    qrId: row.qrId,
    customDomainId: row.customDomainId,
    customHostname: row.customHostname,
    publicUrl: qr.publicUrl ?? hostedProductUrl(row.id),
    totalScans: qr.totalScans,
    lastScanned: row.lastScanned,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const productSelect = `
  SELECT
    p.id,
    p.user_id,
    p.name,
    p."identifierSubmitted",
    p.gtin,
    p."destinationUrl",
    p."hostedExperience",
    p.content,
    p.qualifiers,
    p."pageStyle",
    p."qrId",
    p."customDomainId",
    d.hostname AS "customHostname",
    q."totalScans",
    q."lastScanned",
    q.code AS "publicQrCode",
    q.data AS "qrData",
    p."createdAt",
    p."updatedAt"
  FROM "Product" p
  JOIN "QR" q ON q.id = p."qrId"
  LEFT JOIN "CustomDomain" d ON d.id = p."customDomainId"
`;

export async function getProductsForUser(userId: string): Promise<Product[]> {
  const rows = await queryNoAuth<ProductRow[]>(
    `${productSelect} WHERE p.user_id = $1 ORDER BY p."updatedAt" DESC`,
    [userId],
  );
  return rows.map(mapProduct);
}

export async function getProductByIdForUser(userId: string, productId: string): Promise<Product | null> {
  if (!isUuid(productId)) {
    return null;
  }
  const rows = await queryNoAuth<ProductRow[]>(
    `${productSelect} WHERE p.id = $1 AND p.user_id = $2 LIMIT 1`,
    [productId, userId],
  );
  return rows[0] ? mapProduct(rows[0]) : null;
}

export async function getPublicProduct(productId: string, hostname?: string | null): Promise<Product | null> {
  if (!isUuid(productId)) {
    return null;
  }
  // Public product pages must remain reachable when the visitor also happens
  // to be signed in as a different account; this is intentionally a service-
  // role read constrained by the public active status.
  const normalizedHostname = hostname?.trim().toLowerCase();
  const isCustomHost = Boolean(normalizedHostname && !isPrimaryAppHost(normalizedHostname));
  const rows = await queryAdmin<ProductRow[]>(
    `${productSelect} WHERE p.id = $1 AND p.status = 'active'${isCustomHost ? ` AND d.hostname = $2 AND d.status = 'ready'` : ""} LIMIT 1`,
    isCustomHost ? [productId, normalizedHostname] : [productId],
  );
  return rows[0] ? mapProduct(rows[0]) : null;
}

function validateCreateInput(input: ProductCreateInput) {
  const name = input.name.trim();
  if (!name) {
    throw new ProductValidationError("Product name is required");
  }

  const gtin = validateGtin(input.identifierSubmitted);
  if (!gtin.valid || !gtin.gtin14) {
    throw new ProductValidationError(`Invalid GTIN: ${gtin.reason ?? "check the identifier"}`);
  }

  const hostedExperience = input.hostedExperience ?? !input.destinationUrl;
  const destinationUrl = hostedExperience ? null : input.destinationUrl?.trim() || null;
  if (!hostedExperience && (!destinationUrl || !isHttpUrl(destinationUrl))) {
    throw new ProductValidationError("Add an http(s) destination or choose a hosted product experience");
  }

  const marketRoutes = input.marketRoutes ?? [];
  const seenMarkets = new Set<string>();
  for (const route of marketRoutes) {
    const countryCode = route.countryCode.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(countryCode) || !isHttpUrl(route.url) || seenMarkets.has(countryCode)) {
      throw new ProductValidationError("Each market route needs a unique two-letter country code and an http(s) destination");
    }
    seenMarkets.add(countryCode);
  }

  return {
    name,
    gtin,
    hostedExperience,
    destinationUrl,
    content: cleanContent(input.content),
    qualifiers: cleanQualifiers(input.qualifiers),
    pageStyle: cleanPageStyle(input.pageStyle),
    marketRoutes: marketRoutes.map((route) => ({
      countryCode: route.countryCode.trim().toUpperCase(),
      url: route.url.trim(),
    })),
  };
}

function buildQrData(
  productId: string,
  input: ReturnType<typeof validateCreateInput>,
): QRData {
  const destinationUrl = input.hostedExperience
    ? hostedProductUrl(productId)
    : input.destinationUrl!;

  return {
    type: "url",
    url: destinationUrl,
    name: input.name,
    description: "GS1 Digital Link product identity",
    errorLevel: "M",
    styleSettings: {
      dotStyle: "square",
      dotColorType: "solid",
      dotColors: ["#111827"],
      eyeStyle: "square",
      eyeColorType: "solid",
      eyeColors: ["#111827"],
      innerEyeStyle: "square",
      innerEyeColorType: "solid",
      innerEyeColors: ["#111827"],
      bgColorType: "solid",
      bgColors: ["#ffffff"],
    },
    logoSettings: null,
    borderSettings: null,
    gs1: {
      gtin: input.gtin.gtin14!,
      productName: input.name,
      batchLot: input.qualifiers.batchLot,
      serial: input.qualifiers.serial,
      expiry: input.qualifiers.expiry,
      marketRoutes: input.marketRoutes,
    },
  };
}

export async function createProductForUser(userId: string, input: ProductCreateInput): Promise<Product> {
  const normalized = validateCreateInput(input);
  const productId = randomUUID();
  const preparedQr = await prepareQRCodeCreationForUser(userId, buildQrData(productId, normalized), input.customDomainId);
  const createdRows = await queryNoAuth<{ id: string }[]>(
    `WITH new_qr AS (
       INSERT INTO "QR" (code, data, user_id, "customDomainId")
       VALUES ($1, $2::jsonb, $3, $4)
       RETURNING id
     )
     INSERT INTO "Product"
       (id, user_id, name, "identifierSubmitted", gtin, "destinationUrl", "hostedExperience", content, qualifiers, "pageStyle", "qrId", "customDomainId")
     SELECT $5, $3, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb, $13::jsonb, id, $4
     FROM new_qr
     RETURNING id`,
    [
      preparedQr.code,
      JSON.stringify(preparedQr.data),
      userId,
      preparedQr.customDomainId,
      productId,
      normalized.name,
      input.identifierSubmitted,
      normalized.gtin.gtin14,
      normalized.hostedExperience ? hostedProductUrl(productId) : normalized.destinationUrl,
      normalized.hostedExperience,
      JSON.stringify(normalized.content),
      JSON.stringify(normalized.qualifiers),
      JSON.stringify(normalized.pageStyle),
    ],
  );

  if (!createdRows[0]) {
    throw new Error("Failed to create product");
  }

  const product = await getProductByIdForUser(userId, productId);
  if (!product) {
    throw new Error("Failed to load created product");
  }
  return product;
}

export async function updateProductForUser(
  userId: string,
  productId: string,
  input: ProductUpdateInput,
): Promise<Product | null> {
  const current = await getProductByIdForUser(userId, productId);
  if (!current) {
    return null;
  }

  const name = input.name?.trim() || current.name;
  const hostedExperience = input.hostedExperience ?? current.hostedExperience;
  const destinationUrl = hostedExperience
    ? hostedProductUrl(productId)
    : input.destinationUrl?.trim() || current.destinationUrl;
  const pageStyle = input.pageStyle === undefined
    ? current.pageStyle
    : input.pageStyle === null || Object.keys(input.pageStyle).length === 0
      ? {}
      : cleanPageStyle({ ...current.pageStyle, ...input.pageStyle }, current.pageStyle.logoKey);
  if (!hostedExperience && !isHttpUrl(destinationUrl)) {
    throw new ProductValidationError("Destination must use http or https");
  }

  const qr = await getQRByIdForUser(userId, current.qrId);
  if (!qr || qr.data.type !== "url" || !qr.data.gs1) {
    throw new Error("Product QR identity is missing");
  }

  const updatedData: QRData = {
    ...qr.data,
    url: destinationUrl,
    name,
    gs1: {
      ...qr.data.gs1,
      productName: name,
    },
  };
  await ensureQrMutationAllowed(userId, { data: updatedData, customDomainId: current.customDomainId });
  const resolvedCustomDomainId = await ensureCustomDomainOwnedByUser(userId, current.customDomainId);
  const nextContent = input.content === undefined
    ? current.content
    : cleanContent({ ...input.content, imageKey: current.content.imageKey }, current.content.imageKey);
  const updatedRows = await queryNoAuth<{ id: string }[]>(
    `WITH updated_qr AS (
       UPDATE "QR"
       SET data = $1::jsonb, "customDomainId" = $2
       WHERE id = $3 AND user_id = $4
       RETURNING id
     )
     UPDATE "Product"
     SET name = $5, "destinationUrl" = $6, "hostedExperience" = $7, content = $8::jsonb, "pageStyle" = $9::jsonb, "updatedAt" = NOW()
     WHERE id = $10 AND user_id = $4 AND "qrId" IN (SELECT id FROM updated_qr)
     RETURNING id`,
    [JSON.stringify(updatedData), resolvedCustomDomainId, current.qrId, userId, name, destinationUrl, hostedExperience, JSON.stringify(nextContent), JSON.stringify(pageStyle), productId],
  );

  if (!updatedRows[0]) {
    return null;
  }

  return getProductByIdForUser(userId, productId);
}

export async function attachUploadedImageToProductForUser(userId: string, productId: string, key: string): Promise<Product | null> {
  const current = await getProductByIdForUser(userId, productId);
  if (!current) {
    return null;
  }

  if (!isOwnedUploadObjectKey(key, userId, current.qrId, "images")) {
    throw new ProductValidationError("Invalid product image key");
  }

  const content = cleanContent({
    ...current.content,
    imageKey: key,
    imageUrl: null,
  }, key);
  await queryNoAuth(
    `UPDATE "Product" SET content = $1::jsonb, "updatedAt" = NOW() WHERE id = $2 AND user_id = $3`,
    [JSON.stringify(content), productId, userId],
  );

  return getProductByIdForUser(userId, productId);
}

export async function attachUploadedLogoToProductForUser(userId: string, productId: string, key: string): Promise<Product | null> {
  const current = await getProductByIdForUser(userId, productId);
  if (!current) {
    return null;
  }

  if (!isOwnedUploadObjectKey(key, userId, current.qrId, "logos")) {
    throw new ProductValidationError("Invalid product logo key");
  }

  const pageStyle = cleanPageStyle({
    ...current.pageStyle,
    logoKey: key,
    logoUrl: null,
  }, key);
  await queryNoAuth(
    `UPDATE "Product" SET "pageStyle" = $1::jsonb, "updatedAt" = NOW() WHERE id = $2 AND user_id = $3`,
    [JSON.stringify(pageStyle), productId, userId],
  );

  return getProductByIdForUser(userId, productId);
}

export async function removeUploadedLogoFromProductForUser(
  userId: string,
  productId: string,
): Promise<{ product: Product | null; key: string | null }> {
  const current = await getProductByIdForUser(userId, productId);
  if (!current) {
    return { product: null, key: null };
  }

  const previousKey = current.pageStyle.logoKey;
  const key = previousKey && isOwnedUploadObjectKey(previousKey, userId, current.qrId, "logos")
    ? previousKey
    : null;
  const pageStyle = cleanPageStyle({
    ...current.pageStyle,
    logoKey: null,
    logoUrl: "",
  });
  await queryNoAuth(
    `UPDATE "Product" SET "pageStyle" = $1::jsonb, "updatedAt" = NOW() WHERE id = $2 AND user_id = $3`,
    [JSON.stringify(pageStyle), productId, userId],
  );

  return { product: await getProductByIdForUser(userId, productId), key };
}

export async function deleteProductForUser(userId: string, productId: string): Promise<boolean> {
  const current = await getProductByIdForUser(userId, productId);
  if (!current) {
    return false;
  }

  return deleteQRForUser(userId, current.qrId);
}

export function getProductDigitalLinkPath(product: Product): string {
  return buildGs1DigitalLinkPath({
    gtin: product.gtin,
    productName: product.name,
    batchLot: product.qualifiers.batchLot,
    serial: product.qualifiers.serial,
    expiry: product.qualifiers.expiry,
  });
}
