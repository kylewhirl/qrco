import "server-only";

import { randomBytes, createHash } from "node:crypto";
import { timingSafeEqual } from "node:crypto";
import { queryAdmin, queryNoAuth } from "@/lib/db";
import type { ApiKeyRecord, ApiKeySummary } from "@/lib/types";

const API_KEY_PREFIX = "tqr_live_";
let ensureApiKeyTablePromise: Promise<void> | null = null;

function hashApiKey(apiKey: string) {
  return createHash("sha256").update(apiKey).digest("hex");
}

function maskPrefix(apiKey: string) {
  return apiKey.slice(0, Math.min(apiKey.length, API_KEY_PREFIX.length + 10));
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
          "lastUsedAt" TIMESTAMPTZ,
          "revokedAt" TIMESTAMPTZ,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
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

export async function listApiKeysForUser(userId: string): Promise<ApiKeySummary[]> {
  await ensureApiKeyTable();
  return queryNoAuth<ApiKeySummary[]>(
    `SELECT id, name, prefix, "lastUsedAt", "revokedAt", "createdAt"
     FROM "ApiKey"
     WHERE "userId" = $1
     ORDER BY "createdAt" DESC`,
    [userId],
  );
}

export async function createApiKeyForUser(userId: string, name: string) {
  await ensureApiKeyTable();

  const secret = `${API_KEY_PREFIX}${randomBytes(24).toString("hex")}`;
  const keyHash = hashApiKey(secret);
  const prefix = maskPrefix(secret);

  const result = await queryNoAuth<ApiKeySummary[]>(
    `INSERT INTO "ApiKey" ("userId", name, prefix, "keyHash")
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, prefix, "lastUsedAt", "revokedAt", "createdAt"`,
    [userId, name, prefix, keyHash],
  );

  return {
    apiKey: secret,
    record: result[0],
  };
}

export async function revokeApiKeyForUser(userId: string, apiKeyId: string) {
  await ensureApiKeyTable();

  const result = await queryNoAuth<ApiKeySummary[]>(
    `UPDATE "ApiKey"
     SET "revokedAt" = NOW()
     WHERE id = $1 AND "userId" = $2 AND "revokedAt" IS NULL
     RETURNING id, name, prefix, "lastUsedAt", "revokedAt", "createdAt"`,
    [apiKeyId, userId],
  );

  return result[0] ?? null;
}

export async function getApiKeyRecord(apiKey: string): Promise<ApiKeyRecord | null> {
  await ensureApiKeyTable();

  const keyHash = hashApiKey(apiKey);
  const result = await queryNoAuth<ApiKeyRecord[]>(
    `SELECT id, "userId", name, prefix, "keyHash", "lastUsedAt", "revokedAt", "createdAt"
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

  return record;
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
