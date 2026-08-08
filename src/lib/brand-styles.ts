import "server-only";

import { queryAdmin, queryNoAuth } from "@/lib/db";
import type { BrandProfile, QRData, QrRenderConfig, QrTypeDefaults, StylePreset, StylePresetQrType } from "@/lib/types";

let ensureBrandStylesSchemaPromise: Promise<void> | null = null;

const DEFAULT_RENDER_CONFIG: QrRenderConfig = {
  errorLevel: "M",
  width: 512,
  height: 512,
  margin: 4,
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
  borderSettings: {
    shape: "square",
    colorType: "solid",
    colors: ["#ffffff"],
    gradientType: "linear",
    rotation: 0,
    preset: "classic",
    text: "",
  },
};

function mapBrandProfile(record: BrandProfile | null, userId: string): BrandProfile {
  if (record) {
    return record;
  }

  return {
    id: "default",
    userId,
    brandName: "My brand",
    logoUrl: null,
    websiteUrl: null,
    primaryColor: "#111827",
    accentColor: "#0f766e",
    backgroundColor: "#ffffff",
    cardColor: "#ffffff",
    textColor: "#172033",
    defaultConfig: DEFAULT_RENDER_CONFIG,
    typeDefaults: {},
    createdAt: new Date(0),
    updatedAt: new Date(0),
  };
}

export async function ensureBrandStylesSchema() {
  if (!ensureBrandStylesSchemaPromise) {
    ensureBrandStylesSchemaPromise = (async () => {
      await queryAdmin(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
      await queryAdmin(`CREATE EXTENSION IF NOT EXISTS pg_session_jwt`);
      await queryAdmin(`
        CREATE TABLE IF NOT EXISTS "BrandProfile" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "userId" TEXT NOT NULL UNIQUE,
          "brandName" TEXT NOT NULL,
          "logoUrl" TEXT,
          "websiteUrl" TEXT,
          "primaryColor" TEXT NOT NULL,
          "accentColor" TEXT NOT NULL,
          "backgroundColor" TEXT NOT NULL,
          "cardColor" TEXT,
          "textColor" TEXT,
          "defaultConfig" JSONB NOT NULL,
          "typeDefaults" JSONB NOT NULL DEFAULT '{}'::jsonb,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await queryAdmin(`ALTER TABLE "BrandProfile" ADD COLUMN IF NOT EXISTS "typeDefaults" JSONB NOT NULL DEFAULT '{}'::jsonb`);
      await queryAdmin(`ALTER TABLE "BrandProfile" ADD COLUMN IF NOT EXISTS "websiteUrl" TEXT`);
      await queryAdmin(`ALTER TABLE "BrandProfile" ADD COLUMN IF NOT EXISTS "cardColor" TEXT`);
      await queryAdmin(`ALTER TABLE "BrandProfile" ADD COLUMN IF NOT EXISTS "textColor" TEXT`);
      await queryAdmin(`
        CREATE TABLE IF NOT EXISTS "StylePreset" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "userId" TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          "qrType" TEXT NOT NULL DEFAULT 'all',
          "isDefault" BOOLEAN NOT NULL DEFAULT FALSE,
          config JSONB NOT NULL,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await queryAdmin(`ALTER TABLE "StylePreset" ADD COLUMN IF NOT EXISTS "qrType" TEXT NOT NULL DEFAULT 'all'`);
      await queryAdmin(`CREATE INDEX IF NOT EXISTS "StylePreset_userId_idx" ON "StylePreset" ("userId")`);
      await queryAdmin(`GRANT USAGE ON SCHEMA public TO authenticated`);
      await queryAdmin(`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "BrandProfile" TO authenticated`);
      await queryAdmin(`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "StylePreset" TO authenticated`);
      await queryAdmin(`
        DO $$
        BEGIN
          PERFORM pg_advisory_xact_lock(hashtext('qrco-brand-styles-schema'));
          EXECUTE 'ALTER TABLE "BrandProfile" ENABLE ROW LEVEL SECURITY';
          EXECUTE 'ALTER TABLE "StylePreset" ENABLE ROW LEVEL SECURITY';
          EXECUTE 'DROP POLICY IF EXISTS brand_profile_select_own ON "BrandProfile"';
          EXECUTE 'DROP POLICY IF EXISTS brand_profile_insert_own ON "BrandProfile"';
          EXECUTE 'DROP POLICY IF EXISTS brand_profile_update_own ON "BrandProfile"';
          EXECUTE 'DROP POLICY IF EXISTS style_preset_select_own ON "StylePreset"';
          EXECUTE 'DROP POLICY IF EXISTS style_preset_insert_own ON "StylePreset"';
          EXECUTE 'DROP POLICY IF EXISTS style_preset_update_own ON "StylePreset"';
          EXECUTE 'DROP POLICY IF EXISTS style_preset_delete_own ON "StylePreset"';
          EXECUTE 'CREATE POLICY brand_profile_select_own ON "BrandProfile" FOR SELECT TO authenticated USING (auth.user_id()::text = "userId"::text)';
          EXECUTE 'CREATE POLICY brand_profile_insert_own ON "BrandProfile" FOR INSERT TO authenticated WITH CHECK (auth.user_id()::text = "userId"::text)';
          EXECUTE 'CREATE POLICY brand_profile_update_own ON "BrandProfile" FOR UPDATE TO authenticated USING (auth.user_id()::text = "userId"::text) WITH CHECK (auth.user_id()::text = "userId"::text)';
          EXECUTE 'CREATE POLICY style_preset_select_own ON "StylePreset" FOR SELECT TO authenticated USING (auth.user_id()::text = "userId"::text)';
          EXECUTE 'CREATE POLICY style_preset_insert_own ON "StylePreset" FOR INSERT TO authenticated WITH CHECK (auth.user_id()::text = "userId"::text)';
          EXECUTE 'CREATE POLICY style_preset_update_own ON "StylePreset" FOR UPDATE TO authenticated USING (auth.user_id()::text = "userId"::text) WITH CHECK (auth.user_id()::text = "userId"::text)';
          EXECUTE 'CREATE POLICY style_preset_delete_own ON "StylePreset" FOR DELETE TO authenticated USING (auth.user_id()::text = "userId"::text)';
        END
        $$;
      `);
    })().catch((error) => {
      ensureBrandStylesSchemaPromise = null;
      throw error;
    });
  }

  await ensureBrandStylesSchemaPromise;
}

export async function getBrandProfileForUser(userId: string): Promise<BrandProfile> {
  await ensureBrandStylesSchema();
  const result = await queryNoAuth<BrandProfile[]>(
    `SELECT id, "userId", "brandName", "logoUrl", "websiteUrl", "primaryColor", "accentColor", "backgroundColor", "cardColor", "textColor", "defaultConfig", "typeDefaults", "createdAt", "updatedAt"
     FROM "BrandProfile"
     WHERE "userId" = $1
     LIMIT 1`,
    [userId],
  );

  return mapBrandProfile(result[0] ?? null, userId);
}

export async function upsertBrandProfileForUser(
  userId: string,
  input: Omit<BrandProfile, "id" | "userId" | "createdAt" | "updatedAt">,
): Promise<BrandProfile> {
  await ensureBrandStylesSchema();

  const result = await queryNoAuth<BrandProfile[]>(
    `INSERT INTO "BrandProfile" ("userId", "brandName", "logoUrl", "websiteUrl", "primaryColor", "accentColor", "backgroundColor", "cardColor", "textColor", "defaultConfig", "typeDefaults")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb)
     ON CONFLICT ("userId")
     DO UPDATE SET
       "brandName" = EXCLUDED."brandName",
       "logoUrl" = EXCLUDED."logoUrl",
       "websiteUrl" = EXCLUDED."websiteUrl",
       "primaryColor" = EXCLUDED."primaryColor",
       "accentColor" = EXCLUDED."accentColor",
       "backgroundColor" = EXCLUDED."backgroundColor",
       "cardColor" = EXCLUDED."cardColor",
       "textColor" = EXCLUDED."textColor",
       "defaultConfig" = EXCLUDED."defaultConfig",
       "typeDefaults" = EXCLUDED."typeDefaults",
       "updatedAt" = NOW()
     RETURNING id, "userId", "brandName", "logoUrl", "websiteUrl", "primaryColor", "accentColor", "backgroundColor", "cardColor", "textColor", "defaultConfig", "typeDefaults", "createdAt", "updatedAt"`,
    [
      userId,
      input.brandName,
      input.logoUrl ?? null,
      input.websiteUrl ?? null,
      input.primaryColor,
      input.accentColor,
      input.backgroundColor,
      input.cardColor ?? null,
      input.textColor ?? null,
      JSON.stringify(input.defaultConfig),
      JSON.stringify(input.typeDefaults ?? {}),
    ],
  );

  return result[0];
}

export async function listStylePresetsForUser(userId: string): Promise<StylePreset[]> {
  await ensureBrandStylesSchema();
  return queryNoAuth<StylePreset[]>(
    `SELECT id, "userId", name, description, "qrType", "isDefault", config, "createdAt", "updatedAt"
     FROM "StylePreset"
     WHERE "userId" = $1
     ORDER BY "isDefault" DESC, "updatedAt" DESC`,
    [userId],
  );
}

export async function getStylePresetForUser(userId: string, presetId: string): Promise<StylePreset | null> {
  await ensureBrandStylesSchema();
  const result = await queryNoAuth<StylePreset[]>(
    `SELECT id, "userId", name, description, "qrType", "isDefault", config, "createdAt", "updatedAt"
     FROM "StylePreset"
     WHERE id = $1 AND "userId" = $2
     LIMIT 1`,
    [presetId, userId],
  );

  return result[0] ?? null;
}

async function clearDefaultPreset(
  userId: string,
  qrType: StylePresetQrType,
  excludeId?: string,
) {
  const params: unknown[] = [userId];
  let where = `"userId" = $1 AND "isDefault" = TRUE`;

  if (qrType === "all") {
    where += "";
  } else {
    params.push(qrType);
    where += ` AND ("qrType" = $2 OR "qrType" = 'all')`;
  }

  if (excludeId) {
    params.push(excludeId);
    where += ` AND id <> $${params.length}`;
  }

  await queryNoAuth(`UPDATE "StylePreset" SET "isDefault" = FALSE WHERE ${where}`, params);
}

export async function createStylePresetForUser(
  userId: string,
  input: Omit<StylePreset, "id" | "userId" | "createdAt" | "updatedAt">,
): Promise<StylePreset> {
  await ensureBrandStylesSchema();

  if (input.isDefault) {
    await clearDefaultPreset(userId, input.qrType ?? "all");
  }

  const result = await queryNoAuth<StylePreset[]>(
    `INSERT INTO "StylePreset" ("userId", name, description, "qrType", "isDefault", config)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)
     RETURNING id, "userId", name, description, "qrType", "isDefault", config, "createdAt", "updatedAt"`,
    [
      userId,
      input.name,
      input.description ?? null,
      input.qrType ?? "all",
      input.isDefault,
      JSON.stringify(input.config),
    ],
  );

  return result[0];
}

export async function updateStylePresetForUser(
  userId: string,
  presetId: string,
  input: Partial<Omit<StylePreset, "id" | "userId" | "createdAt" | "updatedAt">>,
): Promise<StylePreset | null> {
  await ensureBrandStylesSchema();

  const current = await getStylePresetForUser(userId, presetId);
  if (!current) {
    return null;
  }

  const next: Omit<StylePreset, "id" | "userId" | "createdAt" | "updatedAt"> = {
    name: input.name ?? current.name,
    description: input.description === undefined ? current.description : input.description ?? null,
    qrType: input.qrType ?? current.qrType,
    isDefault: input.isDefault ?? current.isDefault,
    config: input.config ?? current.config,
  };

  if (next.isDefault) {
    await clearDefaultPreset(userId, next.qrType, presetId);
  }

  const result = await queryNoAuth<StylePreset[]>(
    `UPDATE "StylePreset"
     SET
       name = $3,
       description = $4,
       "qrType" = $5,
       "isDefault" = $6,
       config = $7::jsonb,
       "updatedAt" = NOW()
     WHERE id = $1 AND "userId" = $2
     RETURNING id, "userId", name, description, "qrType", "isDefault", config, "createdAt", "updatedAt"`,
    [presetId, userId, next.name, next.description, next.qrType, next.isDefault, JSON.stringify(next.config)],
  );

  return result[0] ?? null;
}

export async function deleteStylePresetForUser(userId: string, presetId: string): Promise<boolean> {
  await ensureBrandStylesSchema();
  const result = await queryNoAuth<{ id: string }[]>(
    `DELETE FROM "StylePreset"
     WHERE id = $1 AND "userId" = $2
     RETURNING id`,
    [presetId, userId],
  );

  return result.length > 0;
}

export function getDefaultRenderConfig() {
  return DEFAULT_RENDER_CONFIG;
}

export function getTypeDefaultRenderConfig(
  brand: BrandProfile,
  type: QRData["type"],
): QrRenderConfig | null {
  return brand.typeDefaults?.[type as keyof QrTypeDefaults] ?? null;
}

export function mergeRenderConfig(base: QrRenderConfig, override?: QrRenderConfig | null): QrRenderConfig {
  if (!override) {
    return base;
  }

  const borderSettings =
    override.borderSettings === undefined
      ? base.borderSettings
      : override.borderSettings === null
        ? null
        : {
            ...(base.borderSettings ?? DEFAULT_RENDER_CONFIG.borderSettings!),
            ...override.borderSettings,
          };

  return {
    ...base,
    ...override,
    styleSettings: {
      ...(base.styleSettings ?? {}),
      ...(override.styleSettings ?? {}),
    },
    logoSettings: override.logoSettings === undefined ? base.logoSettings : override.logoSettings,
    borderSettings,
  };
}
