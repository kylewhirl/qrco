import "server-only";

import { randomUUID } from "node:crypto";

import { queryAdmin, queryNoAuth } from "@/lib/db";
import {
  buildGs1DigitalLinkPath,
  getGs1DigitalLinkUrlForQr,
  validateGtin,
} from "@/lib/gs1-digital-link";
import {
  ensureCustomDomainOwnedByUser,
  ensureCustomDomainSchema,
} from "@/lib/custom-domains";
import {
  createQRCodeForUser,
  deleteQRForUser,
  getQRByIdForUser,
  updateQRDataForUser,
} from "@/lib/qr-service";
import type {
  Product,
  ProductContent,
  ProductQualifiers,
  QR,
  QRData,
} from "@/lib/types";
import type { ProductPageStyle } from "@/lib/types";
import { getPrimaryAppUrl } from "@/lib/qr-url";

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

let ensureProductsSchemaPromise: Promise<void> | null = null;

const contentKeys: Array<keyof ProductContent> = [
  "description",
  "imageUrl",
  "imageKey",
  "imageAlt",
  "benefits",
  "ingredients",
  "allergens",
  "nutrition",
  "instructions",
  "certifications",
  "origin",
  "sustainability",
  "promotion",
];

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
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    if (url.pathname.startsWith("/product-images/")) {
      return `${url.pathname}${url.search}`;
    }

    return trimmed;
  } catch {
    return null;
  }
}

function cleanContent(content: ProductContent | null | undefined): ProductContent {
  const cleaned: ProductContent = {};

  for (const key of contentKeys) {
    const value = content?.[key];
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
        cleaned[key] = value.trim().slice(0, 512);
        continue;
      }
      const maxLength = key === "imageAlt" ? 160 : key === "benefits" ? 2000 : 5000;
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

function cleanPageStyle(style: ProductPageStyle | null | undefined): ProductPageStyle {
  const cleaned: ProductPageStyle = {};
  const brandName = style?.brandName?.trim();
  const logoUrl = style?.logoUrl?.trim();
  const websiteUrl = style?.websiteUrl?.trim();

  if (brandName) {
    cleaned.brandName = brandName.slice(0, 120);
  }

  if (logoUrl) {
    const normalizedLogoUrl = normalizeProductAssetUrl(logoUrl);
    if (normalizedLogoUrl) {
      cleaned.logoUrl = normalizedLogoUrl.slice(0, 2048);
    }
  }

  if (websiteUrl && isHttpUrl(websiteUrl)) {
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

export async function ensureProductsSchema() {
  if (!ensureProductsSchemaPromise) {
    ensureProductsSchemaPromise = (async () => {
      await ensureCustomDomainSchema();
      await queryAdmin(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
      await queryAdmin(`CREATE EXTENSION IF NOT EXISTS pg_session_jwt`);
      await queryAdmin(`
        CREATE TABLE IF NOT EXISTS "Product" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          "identifierSubmitted" TEXT NOT NULL,
          gtin TEXT NOT NULL,
          "destinationUrl" TEXT NOT NULL,
          "hostedExperience" BOOLEAN NOT NULL DEFAULT FALSE,
          content JSONB NOT NULL DEFAULT '{}'::jsonb,
          qualifiers JSONB NOT NULL DEFAULT '{}'::jsonb,
          "qrId" UUID NOT NULL UNIQUE REFERENCES "QR"(id) ON DELETE CASCADE,
          "customDomainId" UUID REFERENCES "CustomDomain"(id) ON DELETE SET NULL,
          status TEXT NOT NULL DEFAULT 'active',
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await queryAdmin(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "hostedExperience" BOOLEAN NOT NULL DEFAULT FALSE`);
      await queryAdmin(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS content JSONB NOT NULL DEFAULT '{}'::jsonb`);
      await queryAdmin(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS qualifiers JSONB NOT NULL DEFAULT '{}'::jsonb`);
      await queryAdmin(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "pageStyle" JSONB NOT NULL DEFAULT '{}'::jsonb`);
      await queryAdmin(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'`);
      await queryAdmin(`CREATE INDEX IF NOT EXISTS "Product_userId_updatedAt_idx" ON "Product" (user_id, "updatedAt" DESC)`);
      await queryAdmin(`CREATE INDEX IF NOT EXISTS "Product_gtin_idx" ON "Product" (gtin)`);
      await queryAdmin(`GRANT USAGE ON SCHEMA public TO authenticated`);
      await queryAdmin(`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "Product" TO authenticated`);
      await queryAdmin(`
        DO $$
        BEGIN
          EXECUTE 'ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY';
          EXECUTE 'DROP POLICY IF EXISTS product_select_own ON "Product"';
          EXECUTE 'DROP POLICY IF EXISTS product_insert_own ON "Product"';
          EXECUTE 'DROP POLICY IF EXISTS product_update_own ON "Product"';
          EXECUTE 'DROP POLICY IF EXISTS product_delete_own ON "Product"';
          EXECUTE 'CREATE POLICY product_select_own ON "Product" FOR SELECT TO authenticated USING (auth.user_id()::text = user_id::text)';
          EXECUTE 'CREATE POLICY product_insert_own ON "Product" FOR INSERT TO authenticated WITH CHECK (auth.user_id()::text = user_id::text)';
          EXECUTE 'CREATE POLICY product_update_own ON "Product" FOR UPDATE TO authenticated USING (auth.user_id()::text = user_id::text) WITH CHECK (auth.user_id()::text = user_id::text)';
          EXECUTE 'CREATE POLICY product_delete_own ON "Product" FOR DELETE TO authenticated USING (auth.user_id()::text = user_id::text)';
        END
        $$;
      `);
    })().catch((error) => {
      ensureProductsSchemaPromise = null;
      throw error;
    });
  }

  await ensureProductsSchemaPromise;
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
  await ensureProductsSchema();
  const rows = await queryNoAuth<ProductRow[]>(
    `${productSelect} WHERE p.user_id = $1 ORDER BY p."updatedAt" DESC`,
    [userId],
  );
  return rows.map(mapProduct);
}

export async function getProductByIdForUser(userId: string, productId: string): Promise<Product | null> {
  await ensureProductsSchema();
  const rows = await queryNoAuth<ProductRow[]>(
    `${productSelect} WHERE p.id = $1 AND p.user_id = $2 LIMIT 1`,
    [productId, userId],
  );
  return rows[0] ? mapProduct(rows[0]) : null;
}

export async function getPublicProduct(productId: string): Promise<Product | null> {
  await ensureProductsSchema();
  // Public product pages must remain reachable when the visitor also happens
  // to be signed in as a different account; this is intentionally a service-
  // role read constrained by the public active status.
  const rows = await queryAdmin<ProductRow[]>(
    `${productSelect} WHERE p.id = $1 AND p.status = 'active' LIMIT 1`,
    [productId],
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
  await ensureProductsSchema();
  const normalized = validateCreateInput(input);
  const resolvedCustomDomainId = await ensureCustomDomainOwnedByUser(userId, input.customDomainId);
  const productId = randomUUID();
  const qr = await createQRCodeForUser(userId, buildQrData(productId, normalized), resolvedCustomDomainId);

  try {
    await queryNoAuth(
      `INSERT INTO "Product"
        (id, user_id, name, "identifierSubmitted", gtin, "destinationUrl", "hostedExperience", content, qualifiers, "pageStyle", "qrId", "customDomainId")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10::jsonb, $11, $12)`,
      [
        productId,
        userId,
        normalized.name,
        input.identifierSubmitted,
        normalized.gtin.gtin14,
        normalized.hostedExperience ? hostedProductUrl(productId) : normalized.destinationUrl,
        normalized.hostedExperience,
        JSON.stringify(normalized.content),
        JSON.stringify(normalized.qualifiers),
        JSON.stringify(normalized.pageStyle),
        qr.id,
        resolvedCustomDomainId,
      ],
    );
  } catch (error) {
    await deleteQRForUser(userId, qr.id);
    throw error;
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
  await ensureProductsSchema();
  const current = await getProductByIdForUser(userId, productId);
  if (!current) {
    return null;
  }

  const name = input.name?.trim() || current.name;
  const hostedExperience = input.hostedExperience ?? current.hostedExperience;
  const destinationUrl = hostedExperience
    ? hostedProductUrl(productId)
    : input.destinationUrl?.trim() || current.destinationUrl;
  const pageStyle = input.pageStyle === undefined ? current.pageStyle : cleanPageStyle(input.pageStyle);
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
  await updateQRDataForUser(userId, current.qrId, updatedData, current.customDomainId);

  await queryNoAuth(
    `UPDATE "Product"
     SET name = $1, "destinationUrl" = $2, "hostedExperience" = $3, content = $4::jsonb, "pageStyle" = $5::jsonb, "updatedAt" = NOW()
     WHERE id = $6 AND user_id = $7`,
    [name, destinationUrl, hostedExperience, JSON.stringify(cleanContent(input.content ?? current.content)), JSON.stringify(pageStyle), productId, userId],
  );

  return getProductByIdForUser(userId, productId);
}

export async function attachUploadedImageToProductForUser(userId: string, productId: string, key: string): Promise<Product | null> {
  await ensureProductsSchema();
  const current = await getProductByIdForUser(userId, productId);
  if (!current) {
    return null;
  }

  const content = cleanContent({
    ...current.content,
    imageKey: key,
    imageUrl: null,
  });
  await queryNoAuth(
    `UPDATE "Product" SET content = $1::jsonb, "updatedAt" = NOW() WHERE id = $2 AND user_id = $3`,
    [JSON.stringify(content), productId, userId],
  );

  return getProductByIdForUser(userId, productId);
}

export async function deleteProductForUser(userId: string, productId: string): Promise<boolean> {
  await ensureProductsSchema();
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
