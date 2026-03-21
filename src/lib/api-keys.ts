import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { queryAdmin, queryNoAuth } from "@/lib/db";
import type {
  ApiAccessScope,
  ApiKeyCreateResult,
  ApiKeyRecord,
  ApiKeySummary,
  ApiTokenKind,
  PublishableTokenCreateInput,
} from "@/lib/types";

const SECRET_API_KEY_PREFIX = "tqr_live_";
const PUBLISHABLE_API_KEY_PREFIX = "tqr_pk_";

export const ALL_API_ACCESS_SCOPES: ApiAccessScope[] = [
  "qr:read",
  "qr:write",
  "analytics:read",
  "brand:read",
  "brand:write",
  "styles:read",
  "styles:write",
];

let ensureApiKeyTablePromise: Promise<void> | null = null;

function hashApiKey(apiKey: string) {
  return createHash("sha256").update(apiKey).digest("hex");
}

function maskPrefix(apiKey: string) {
  return apiKey.slice(0, Math.min(apiKey.length, 18));
}

function getTokenPrefix(kind: ApiTokenKind) {
  return kind === "publishable" ? PUBLISHABLE_API_KEY_PREFIX : SECRET_API_KEY_PREFIX;
}

function normalizeScopes(kind: ApiTokenKind, scopes: ApiAccessScope[] | null | undefined) {
  if (kind === "secret") {
    return ALL_API_ACCESS_SCOPES;
  }

  return Array.from(new Set(scopes ?? []));
}

function normalizeAllowedOrigins(origins: string[] | null | undefined) {
  if (!origins?.length) {
    return null;
  }

  return Array.from(
    new Set(
      origins
        .map((origin) => {
          try {
            return new URL(origin).origin;
          } catch {
            return null;
          }
        })
        .filter((value): value is string => Boolean(value)),
    ),
  );
}

function mapApiKeySummary(record: ApiKeySummary): ApiKeySummary {
  return {
    ...record,
    kind: record.kind ?? "secret",
    scopes: normalizeScopes(record.kind ?? "secret", record.scopes),
    allowedOrigins: normalizeAllowedOrigins(record.allowedOrigins),
  };
}

function mapApiKeyRecord(record: ApiKeyRecord): ApiKeyRecord {
  return {
    ...record,
    kind: record.kind ?? "secret",
    scopes: normalizeScopes(record.kind ?? "secret", record.scopes),
    allowedOrigins: normalizeAllowedOrigins(record.allowedOrigins),
  };
}

async function ensureApiKeyTable() {
  if (!ensureApiKeyTablePromise) {
    ensureApiKeyTablePromise = (async () => {
      await queryAdmin(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
      await queryAdmin(`CREATE EXTENSION IF NOT EXISTS pg_session_jwt`);
      await queryAdmin(`
        CREATE TABLE IF NOT EXISTS "ApiKey" (
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
        )
      `);
      await queryAdmin(`ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'secret'`);
      await queryAdmin(`ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS scopes JSONB NOT NULL DEFAULT '[]'::jsonb`);
      await queryAdmin(`ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "allowedOrigins" JSONB`);
      await queryAdmin(`UPDATE "ApiKey" SET kind = 'secret' WHERE kind IS NULL`);
      await queryAdmin(`UPDATE "ApiKey" SET scopes = '[]'::jsonb WHERE scopes IS NULL`);
      await queryAdmin(`CREATE INDEX IF NOT EXISTS "ApiKey_userId_idx" ON "ApiKey" ("userId")`);
      await queryAdmin(`CREATE INDEX IF NOT EXISTS "ApiKey_active_idx" ON "ApiKey" ("userId", "revokedAt")`);
      await queryAdmin(`GRANT USAGE ON SCHEMA public TO authenticated`);
      await queryAdmin(`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "ApiKey" TO authenticated`);
      await queryAdmin(`
        DO $$
        BEGIN
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
        $$;
      `);
    })().catch((error) => {
      ensureApiKeyTablePromise = null;
      throw error;
    });
  }

  await ensureApiKeyTablePromise;
}

async function createAccessTokenForUser(userId: string, input: {
  name: string;
  kind: ApiTokenKind;
  scopes?: ApiAccessScope[];
  allowedOrigins?: string[] | null;
}): Promise<ApiKeyCreateResult> {
  await ensureApiKeyTable();

  const secret = `${getTokenPrefix(input.kind)}${randomBytes(24).toString("hex")}`;
  const keyHash = hashApiKey(secret);
  const prefix = maskPrefix(secret);
  const scopes = normalizeScopes(input.kind, input.scopes);
  const allowedOrigins = input.kind === "publishable" ? normalizeAllowedOrigins(input.allowedOrigins) : null;

  const result = await queryNoAuth<ApiKeySummary[]>(
    `INSERT INTO "ApiKey" ("userId", name, prefix, "keyHash", kind, scopes, "allowedOrigins")
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb)
     RETURNING id, name, prefix, kind, scopes, "allowedOrigins", "lastUsedAt", "revokedAt", "createdAt"`,
    [userId, input.name, prefix, keyHash, input.kind, JSON.stringify(scopes), JSON.stringify(allowedOrigins)],
  );

  return {
    apiKey: secret,
    record: mapApiKeySummary(result[0]),
  };
}

export async function listApiKeysForUser(userId: string, kind: ApiTokenKind = "secret"): Promise<ApiKeySummary[]> {
  await ensureApiKeyTable();
  const rows = await queryNoAuth<ApiKeySummary[]>(
    `SELECT id, name, prefix, kind, scopes, "allowedOrigins", "lastUsedAt", "revokedAt", "createdAt"
     FROM "ApiKey"
     WHERE "userId" = $1 AND kind = $2
     ORDER BY "createdAt" DESC`,
    [userId, kind],
  );

  return rows.map(mapApiKeySummary);
}

export async function listPublishableTokensForUser(userId: string) {
  return listApiKeysForUser(userId, "publishable");
}

export async function createApiKeyForUser(userId: string, name: string) {
  return createAccessTokenForUser(userId, {
    name,
    kind: "secret",
  });
}

export async function createPublishableTokenForUser(userId: string, input: PublishableTokenCreateInput) {
  return createAccessTokenForUser(userId, {
    name: input.name,
    kind: "publishable",
    scopes: input.scopes,
    allowedOrigins: input.allowedOrigins,
  });
}

export async function revokeApiKeyForUser(userId: string, apiKeyId: string) {
  await ensureApiKeyTable();

  const result = await queryNoAuth<ApiKeySummary[]>(
    `UPDATE "ApiKey"
     SET "revokedAt" = NOW()
     WHERE id = $1 AND "userId" = $2 AND "revokedAt" IS NULL
     RETURNING id, name, prefix, kind, scopes, "allowedOrigins", "lastUsedAt", "revokedAt", "createdAt"`,
    [apiKeyId, userId],
  );

  return result[0] ? mapApiKeySummary(result[0]) : null;
}

export async function getApiKeyRecord(apiKey: string): Promise<ApiKeyRecord | null> {
  await ensureApiKeyTable();

  const keyHash = hashApiKey(apiKey);
  const result = await queryNoAuth<ApiKeyRecord[]>(
    `SELECT id, "userId", name, prefix, "keyHash", kind, scopes, "allowedOrigins", "lastUsedAt", "revokedAt", "createdAt"
     FROM "ApiKey"
     WHERE "keyHash" = $1
     LIMIT 1`,
    [keyHash],
  );

  const record = result[0];
  if (!record || record.revokedAt) {
    return null;
  }

  const stored = Buffer.from(record.keyHash, "utf8");
  const provided = Buffer.from(keyHash, "utf8");
  if (stored.length !== provided.length || !timingSafeEqual(stored, provided)) {
    return null;
  }

  return mapApiKeyRecord(record);
}

export async function touchApiKeyLastUsed(apiKeyId: string) {
  await ensureApiKeyTable();
  await queryNoAuth(
    `UPDATE "ApiKey"
     SET "lastUsedAt" = NOW()
     WHERE id = $1`,
    [apiKeyId],
  );
}
