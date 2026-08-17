import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run database migrations");
}

const migrations = [
  {
    id: "20260816_compute_optimization",
    statements: [
      `CREATE EXTENSION IF NOT EXISTS "pgcrypto"`,
      `CREATE EXTENSION IF NOT EXISTS pg_session_jwt`,
      `CREATE TABLE IF NOT EXISTS "BillingUsageCounter" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" TEXT NOT NULL,
        meter TEXT NOT NULL,
        "periodKey" TEXT NOT NULL,
        count INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE ("userId", meter, "periodKey")
      )`,
      `CREATE INDEX IF NOT EXISTS "BillingUsageCounter_user_meter_period_idx"
        ON "BillingUsageCounter" ("userId", meter, "periodKey")`,
      `CREATE TABLE IF NOT EXISTS "ApiKey" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" TEXT NOT NULL,
        name TEXT NOT NULL,
        prefix TEXT NOT NULL,
        "keyHash" TEXT NOT NULL UNIQUE,
        kind TEXT NOT NULL DEFAULT 'secret',
        scopes JSONB NOT NULL DEFAULT '[]'::jsonb,
        "allowedOrigins" JSONB,
        "lastUsedAt" TIMESTAMPTZ,
        "revokedAt" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      `ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'secret'`,
      `ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS scopes JSONB NOT NULL DEFAULT '[]'::jsonb`,
      `ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "allowedOrigins" JSONB`,
      `UPDATE "ApiKey" SET kind = 'secret' WHERE kind IS NULL`,
      `UPDATE "ApiKey" SET scopes = '[]'::jsonb WHERE scopes IS NULL`,
      `CREATE INDEX IF NOT EXISTS "ApiKey_userId_idx" ON "ApiKey" ("userId")`,
      `CREATE INDEX IF NOT EXISTS "ApiKey_active_idx" ON "ApiKey" ("userId", "revokedAt")`,
      `CREATE TABLE IF NOT EXISTS "BrandProfile" (
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
      )`,
      `ALTER TABLE "BrandProfile" ADD COLUMN IF NOT EXISTS "typeDefaults" JSONB NOT NULL DEFAULT '{}'::jsonb`,
      `ALTER TABLE "BrandProfile" ADD COLUMN IF NOT EXISTS "websiteUrl" TEXT`,
      `ALTER TABLE "BrandProfile" ADD COLUMN IF NOT EXISTS "cardColor" TEXT`,
      `ALTER TABLE "BrandProfile" ADD COLUMN IF NOT EXISTS "textColor" TEXT`,
      `CREATE TABLE IF NOT EXISTS "StylePreset" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        "qrType" TEXT NOT NULL DEFAULT 'all',
        "isDefault" BOOLEAN NOT NULL DEFAULT FALSE,
        config JSONB NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      `ALTER TABLE "StylePreset" ADD COLUMN IF NOT EXISTS "qrType" TEXT NOT NULL DEFAULT 'all'`,
      `CREATE INDEX IF NOT EXISTS "StylePreset_userId_idx" ON "StylePreset" ("userId")`,
      `CREATE TABLE IF NOT EXISTS "CustomDomain" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" TEXT NOT NULL,
        hostname TEXT NOT NULL UNIQUE,
        "apexName" TEXT NOT NULL,
        status TEXT NOT NULL,
        verification JSONB,
        configuration JSONB,
        "fallbackUrl" TEXT,
        "verifiedAt" TIMESTAMPTZ,
        "lastCheckedAt" TIMESTAMPTZ,
        "isPrimary" BOOLEAN NOT NULL DEFAULT FALSE,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      `ALTER TABLE "CustomDomain" ADD COLUMN IF NOT EXISTS configuration JSONB`,
      `ALTER TABLE "CustomDomain" ADD COLUMN IF NOT EXISTS "fallbackUrl" TEXT`,
      `CREATE INDEX IF NOT EXISTS "CustomDomain_userId_idx" ON "CustomDomain" ("userId")`,
      `CREATE INDEX IF NOT EXISTS "CustomDomain_status_idx" ON "CustomDomain" ("userId", status)`,
      `ALTER TABLE "QR"
        ADD COLUMN IF NOT EXISTS "customDomainId" UUID REFERENCES "CustomDomain"(id) ON DELETE SET NULL`,
      `CREATE INDEX IF NOT EXISTS "QR_customDomainId_idx" ON "QR" ("customDomainId")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "QR_code_platform_unique_idx"
        ON "QR" (code) WHERE "customDomainId" IS NULL`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "QR_code_domain_unique_idx"
        ON "QR" ("customDomainId", code) WHERE "customDomainId" IS NOT NULL`,
      `CREATE TABLE IF NOT EXISTS "Product" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        "identifierSubmitted" TEXT NOT NULL,
        gtin TEXT NOT NULL,
        "destinationUrl" TEXT NOT NULL,
        "hostedExperience" BOOLEAN NOT NULL DEFAULT FALSE,
        content JSONB NOT NULL DEFAULT '{}'::jsonb,
        qualifiers JSONB NOT NULL DEFAULT '{}'::jsonb,
        "pageStyle" JSONB NOT NULL DEFAULT '{}'::jsonb,
        "qrId" UUID NOT NULL UNIQUE REFERENCES "QR"(id) ON DELETE CASCADE,
        "customDomainId" UUID REFERENCES "CustomDomain"(id) ON DELETE SET NULL,
        status TEXT NOT NULL DEFAULT 'active',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "hostedExperience" BOOLEAN NOT NULL DEFAULT FALSE`,
      `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS content JSONB NOT NULL DEFAULT '{}'::jsonb`,
      `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS qualifiers JSONB NOT NULL DEFAULT '{}'::jsonb`,
      `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "pageStyle" JSONB NOT NULL DEFAULT '{}'::jsonb`,
      `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'`,
      `CREATE INDEX IF NOT EXISTS "Product_userId_updatedAt_idx"
        ON "Product" (user_id, "updatedAt" DESC)`,
      `CREATE INDEX IF NOT EXISTS "Product_gtin_idx" ON "Product" (gtin)`,
      `CREATE INDEX IF NOT EXISTS "Scan_qrId_scannedAt_idx"
        ON "Scan" ("qrId", "scannedAt" DESC)`,
      `CREATE INDEX IF NOT EXISTS "Scan_scannedAt_idx"
        ON "Scan" ("scannedAt" DESC)`,
      `GRANT USAGE ON SCHEMA public TO authenticated`,
      `GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "ApiKey" TO authenticated`,
      `GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "BrandProfile" TO authenticated`,
      `GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "StylePreset" TO authenticated`,
      `GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "CustomDomain" TO authenticated`,
      `GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "QR" TO authenticated`,
      `GRANT SELECT, INSERT ON TABLE "Scan" TO authenticated`,
      `GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "Product" TO authenticated`,
      `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated`,
      `DO $$
      BEGIN
        PERFORM pg_advisory_xact_lock(hashtext('qrco-api-key-schema'));
        EXECUTE 'ALTER TABLE "ApiKey" ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS api_key_select_own ON "ApiKey"';
        EXECUTE 'DROP POLICY IF EXISTS api_key_insert_own ON "ApiKey"';
        EXECUTE 'DROP POLICY IF EXISTS api_key_update_own ON "ApiKey"';
        EXECUTE 'DROP POLICY IF EXISTS api_key_delete_own ON "ApiKey"';
        EXECUTE 'CREATE POLICY api_key_select_own ON "ApiKey" FOR SELECT TO authenticated USING (auth.user_id()::text = "userId"::text)';
        EXECUTE 'CREATE POLICY api_key_insert_own ON "ApiKey" FOR INSERT TO authenticated WITH CHECK (auth.user_id()::text = "userId"::text)';
        EXECUTE 'CREATE POLICY api_key_update_own ON "ApiKey" FOR UPDATE TO authenticated USING (auth.user_id()::text = "userId"::text) WITH CHECK (auth.user_id()::text = "userId"::text)';
        EXECUTE 'CREATE POLICY api_key_delete_own ON "ApiKey" FOR DELETE TO authenticated USING (auth.user_id()::text = "userId"::text)';
      END
      $$`,
      `DO $$
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
      $$`,
      `DO $$
      BEGIN
        PERFORM pg_advisory_xact_lock(hashtext('qrco-custom-domain-schema'));
        EXECUTE 'ALTER TABLE "CustomDomain" ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS custom_domain_select_own ON "CustomDomain"';
        EXECUTE 'DROP POLICY IF EXISTS custom_domain_insert_own ON "CustomDomain"';
        EXECUTE 'DROP POLICY IF EXISTS custom_domain_update_own ON "CustomDomain"';
        EXECUTE 'DROP POLICY IF EXISTS custom_domain_delete_own ON "CustomDomain"';
        EXECUTE 'CREATE POLICY custom_domain_select_own ON "CustomDomain" FOR SELECT TO authenticated USING (auth.user_id()::text = "userId"::text)';
        EXECUTE 'CREATE POLICY custom_domain_insert_own ON "CustomDomain" FOR INSERT TO authenticated WITH CHECK (auth.user_id()::text = "userId"::text)';
        EXECUTE 'CREATE POLICY custom_domain_update_own ON "CustomDomain" FOR UPDATE TO authenticated USING (auth.user_id()::text = "userId"::text) WITH CHECK (auth.user_id()::text = "userId"::text)';
        EXECUTE 'CREATE POLICY custom_domain_delete_own ON "CustomDomain" FOR DELETE TO authenticated USING (auth.user_id()::text = "userId"::text)';
      END
      $$`,
      `DO $$
      BEGIN
        PERFORM pg_advisory_xact_lock(hashtext('qrco-qr-schema'));
        EXECUTE 'ALTER TABLE "QR" ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS qr_select_own ON "QR"';
        EXECUTE 'DROP POLICY IF EXISTS qr_insert_own ON "QR"';
        EXECUTE 'DROP POLICY IF EXISTS qr_update_own ON "QR"';
        EXECUTE 'DROP POLICY IF EXISTS qr_delete_own ON "QR"';
        EXECUTE 'CREATE POLICY qr_select_own ON "QR" FOR SELECT TO authenticated USING (auth.user_id()::text = user_id::text)';
        EXECUTE 'CREATE POLICY qr_insert_own ON "QR" FOR INSERT TO authenticated WITH CHECK (auth.user_id()::text = user_id::text)';
        EXECUTE 'CREATE POLICY qr_update_own ON "QR" FOR UPDATE TO authenticated USING (auth.user_id()::text = user_id::text) WITH CHECK (auth.user_id()::text = user_id::text)';
        EXECUTE 'CREATE POLICY qr_delete_own ON "QR" FOR DELETE TO authenticated USING (auth.user_id()::text = user_id::text)';
        EXECUTE 'ALTER TABLE "Scan" ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS scan_select_own ON "Scan"';
        EXECUTE 'DROP POLICY IF EXISTS scan_insert_own ON "Scan"';
        EXECUTE 'CREATE POLICY scan_select_own ON "Scan" FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM "QR" q WHERE q.id = "qrId" AND q.user_id::text = auth.user_id()::text))';
        EXECUTE 'CREATE POLICY scan_insert_own ON "Scan" FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM "QR" q WHERE q.id = "qrId" AND q.user_id::text = auth.user_id()::text))';
      END
      $$`,
      `DO $$
      BEGIN
        PERFORM pg_advisory_xact_lock(hashtext('qrco-product-schema'));
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
      $$`,
    ],
  },
];

const sql = neon(databaseUrl);

await sql.query(`
  CREATE TABLE IF NOT EXISTS "_SchemaMigration" (
    id TEXT PRIMARY KEY,
    "appliedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`);

const appliedRows = await sql.query(`SELECT id FROM "_SchemaMigration"`);
const appliedIds = new Set(appliedRows.map((row) => row.id));

for (const migration of migrations) {
  if (appliedIds.has(migration.id)) {
    continue;
  }

  console.log(`Applying database migration ${migration.id}`);
  for (const statement of migration.statements) {
    await sql.query(statement);
  }
  await sql.query(
    `INSERT INTO "_SchemaMigration" (id) VALUES ($1) ON CONFLICT (id) DO NOTHING`,
    [migration.id],
  );
}
