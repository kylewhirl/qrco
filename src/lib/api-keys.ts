import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { queryNoAuth } from "@/lib/db";
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
  if (!scopes?.length) {
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

async function createAccessTokenForUser(userId: string, input: {
  name: string;
  kind: ApiTokenKind;
  scopes?: ApiAccessScope[];
  allowedOrigins?: string[] | null;
}): Promise<ApiKeyCreateResult> {
  const secret = `${getTokenPrefix(input.kind)}${randomBytes(24).toString("hex")}`;
  const keyHash = hashApiKey(secret);
  const prefix = maskPrefix(secret);
  const scopes = normalizeScopes(input.kind, input.scopes);
  const allowedOrigins = normalizeAllowedOrigins(input.allowedOrigins);

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
    scopes: ALL_API_ACCESS_SCOPES,
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
  const result = await queryNoAuth<ApiKeySummary[]>(
    `UPDATE "ApiKey"
     SET "revokedAt" = NOW()
     WHERE id = $1 AND "userId" = $2 AND "revokedAt" IS NULL
     RETURNING id, name, prefix, kind, scopes, "allowedOrigins", "lastUsedAt", "revokedAt", "createdAt"`,
    [apiKeyId, userId],
  );

  return result[0] ? mapApiKeySummary(result[0]) : null;
}

export async function updateApiKeyForUser(
  userId: string,
  apiKeyId: string,
  input: {
    name?: string;
    scopes?: ApiAccessScope[];
    allowedOrigins?: string[] | null;
  },
) {
  const currentResult = await queryNoAuth<ApiKeySummary[]>(
    `SELECT id, name, prefix, kind, scopes, "allowedOrigins", "lastUsedAt", "revokedAt", "createdAt"
     FROM "ApiKey"
     WHERE id = $1 AND "userId" = $2
     LIMIT 1`,
    [apiKeyId, userId],
  );

  const current = currentResult[0] ? mapApiKeySummary(currentResult[0]) : null;
  if (!current) {
    return null;
  }

  const nextName = input.name?.trim() ? input.name.trim() : current.name;
  const nextScopes = input.scopes ? normalizeScopes(current.kind, input.scopes) : current.scopes;
  const nextAllowedOrigins =
    input.allowedOrigins !== undefined ? normalizeAllowedOrigins(input.allowedOrigins) : current.allowedOrigins;

  const result = await queryNoAuth<ApiKeySummary[]>(
    `UPDATE "ApiKey"
     SET
       name = $3,
       scopes = $4::jsonb,
       "allowedOrigins" = $5::jsonb
     WHERE id = $1 AND "userId" = $2
     RETURNING id, name, prefix, kind, scopes, "allowedOrigins", "lastUsedAt", "revokedAt", "createdAt"`,
    [apiKeyId, userId, nextName, JSON.stringify(nextScopes), JSON.stringify(nextAllowedOrigins)],
  );

  return result[0] ? mapApiKeySummary(result[0]) : null;
}

export async function getApiKeyRecord(apiKey: string): Promise<ApiKeyRecord | null> {
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
  await queryNoAuth(
    `UPDATE "ApiKey"
     SET "lastUsedAt" = NOW()
     WHERE id = $1`,
    [apiKeyId],
  );
}
