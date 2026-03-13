import "server-only";

import { queryAdmin, queryNoAuth } from "@/lib/db";
import type { BrandProfile, QrRenderConfig, StylePreset } from "@/lib/types";

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
    primaryColor: "#111827",
    accentColor: "#0f766e",
    backgroundColor: "#ffffff",
    defaultConfig: DEFAULT_RENDER_CONFIG,
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
          "primaryColor" TEXT NOT NULL,
          "accentColor" TEXT NOT NULL,
          "backgroundColor" TEXT NOT NULL,
          "defaultConfig" JSONB NOT NULL,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await queryAdmin(`
        CREATE TABLE IF NOT EXISTS "StylePreset" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "userId" TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          "isDefault" BOOLEAN NOT NULL DEFAULT FALSE,
          config JSONB NOT NULL,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await queryAdmin(`CREATE INDEX IF NOT EXISTS "StylePreset_userId_idx" ON "StylePreset" ("userId")`);
      await queryAdmin(`GRANT USAGE ON SCHEMA public TO authenticated`);
      await queryAdmin(`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "BrandProfile" TO authenticated`);
      await queryAdmin(`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "StylePreset" TO authenticated`);
      await queryAdmin(`
        DO $$
        BEGIN
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
    `SELECT id, "userId", "brandName", "logoUrl", "primaryColor", "accentColor", "backgroundColor", "defaultConfig", "createdAt", "updatedAt"
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
    `INSERT INTO "BrandProfile" ("userId", "brandName", "logoUrl", "primaryColor", "accentColor", "backgroundColor", "defaultConfig")
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
     ON CONFLICT ("userId")
     DO UPDATE SET
       "brandName" = EXCLUDED."brandName",
       "logoUrl" = EXCLUDED."logoUrl",
       "primaryColor" = EXCLUDED."primaryColor",
       "accentColor" = EXCLUDED."accentColor",
       "backgroundColor" = EXCLUDED."backgroundColor",
       "defaultConfig" = EXCLUDED."defaultConfig",
       "updatedAt" = NOW()
     RETURNING id, "userId", "brandName", "logoUrl", "primaryColor", "accentColor", "backgroundColor", "defaultConfig", "createdAt", "updatedAt"`,
    [
      userId,
      input.brandName,
      input.logoUrl ?? null,
      input.primaryColor,
      input.accentColor,
      input.backgroundColor,
      JSON.stringify(input.defaultConfig),
    ],
  );

  return result[0];
}

export async function listStylePresetsForUser(userId: string): Promise<StylePreset[]> {
  await ensureBrandStylesSchema();
  return queryNoAuth<StylePreset[]>(
    `SELECT id, "userId", name, description, "isDefault", config, "createdAt", "updatedAt"
     FROM "StylePreset"
     WHERE "userId" = $1
     ORDER BY "isDefault" DESC, "updatedAt" DESC`,
    [userId],
  );
}

export async function getStylePresetForUser(userId: string, presetId: string): Promise<StylePreset | null> {
  await ensureBrandStylesSchema();
  const result = await queryNoAuth<StylePreset[]>(
    `SELECT id, "userId", name, description, "isDefault", config, "createdAt", "updatedAt"
     FROM "StylePreset"
     WHERE id = $1 AND "userId" = $2
     LIMIT 1`,
    [presetId, userId],
  );

  return result[0] ?? null;
}

async function clearDefaultPreset(userId: string, excludeId?: string) {
  const params: unknown[] = [userId];
  let where = `"userId" = $1`;
  if (excludeId) {
    params.push(excludeId);
    where += ` AND id <> $2`;
  }

  await queryNoAuth(`UPDATE "StylePreset" SET "isDefault" = FALSE WHERE ${where}`, params);
}

export async function createStylePresetForUser(
  userId: string,
  input: Omit<StylePreset, "id" | "userId" | "createdAt" | "updatedAt">,
): Promise<StylePreset> {
  await ensureBrandStylesSchema();

  if (input.isDefault) {
    await clearDefaultPreset(userId);
  }

  const result = await queryNoAuth<StylePreset[]>(
    `INSERT INTO "StylePreset" ("userId", name, description, "isDefault", config)
     VALUES ($1, $2, $3, $4, $5::jsonb)
     RETURNING id, "userId", name, description, "isDefault", config, "createdAt", "updatedAt"`,
    [userId, input.name, input.description ?? null, input.isDefault, JSON.stringify(input.config)],
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
    isDefault: input.isDefault ?? current.isDefault,
    config: input.config ?? current.config,
  };

  if (next.isDefault) {
    await clearDefaultPreset(userId, presetId);
  }

  const result = await queryNoAuth<StylePreset[]>(
    `UPDATE "StylePreset"
     SET
       name = $3,
       description = $4,
       "isDefault" = $5,
       config = $6::jsonb,
       "updatedAt" = NOW()
     WHERE id = $1 AND "userId" = $2
     RETURNING id, "userId", name, description, "isDefault", config, "createdAt", "updatedAt"`,
    [presetId, userId, next.name, next.description, next.isDefault, JSON.stringify(next.config)],
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
