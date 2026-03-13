import "server-only";

import { queryAdmin, queryNoAuth } from "@/lib/db";
import type {
  CustomDomain,
  CustomDomainStatus,
  DomainConfiguration,
  DomainVerificationInstruction,
} from "@/lib/types";
import { getApexName, isValidHostname, normalizeHostname } from "@/lib/qr-url";

type VercelDomainRecord = {
  name?: string
  verified?: boolean
  verification?: DomainVerificationInstruction[] | null
};

type VercelDomainConfigRecord = {
  configuredBy?: DomainConfiguration["configuredBy"]
  acceptedChallenges?: Array<"dns-01" | "http-01"> | string[]
  misconfigured?: boolean
  recommendedIPv4?: Array<{ rank: number; value: string[] }>
  recommendedCNAME?: Array<{ rank: number; value: string }>
};

type CustomDomainRow = Omit<CustomDomain, "configuration"> & {
  configuration: DomainConfiguration | null
};

let ensureCustomDomainSchemaPromise: Promise<void> | null = null;

function getVercelConfig() {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID;
  const teamSlug = process.env.VERCEL_TEAM_SLUG;

  if (!token || !projectId) {
    throw new Error("VERCEL_TOKEN and VERCEL_PROJECT_ID are required for custom domain management");
  }

  return {
    token,
    projectId,
    teamId,
    teamSlug,
  };
}

function getVerification(record: VercelDomainRecord | null): DomainVerificationInstruction[] | null {
  if (!record?.verification || !Array.isArray(record.verification)) {
    return null;
  }

  return record.verification;
}

function getStatus(record: VercelDomainRecord | null, configuration: DomainConfiguration | null): CustomDomainStatus {
  if (!record) {
    return "failed";
  }
  if (!record.verified) {
    return "pending_verification";
  }
  if (!configuration || configuration.misconfigured) {
    return "pending_configuration";
  }
  return "ready";
}

function buildProjectDomainApiUrl(pathname: string): string {
  const { projectId, teamId, teamSlug } = getVercelConfig();
  const search = new URLSearchParams();

  if (teamId) {
    search.set("teamId", teamId);
  }
  if (teamSlug) {
    search.set("slug", teamSlug);
  }

  const query = search.toString();
  return `https://api.vercel.com/v10/projects/${projectId}${pathname}${query ? `?${query}` : ""}`;
}

function buildDomainConfigApiUrl(hostname: string): string {
  const { projectId, teamId, teamSlug } = getVercelConfig();
  const search = new URLSearchParams({ projectIdOrName: projectId });

  if (teamId) {
    search.set("teamId", teamId);
  }
  if (teamSlug) {
    search.set("slug", teamSlug);
  }

  return `https://api.vercel.com/v6/domains/${encodeURIComponent(hostname)}/config?${search.toString()}`;
}

async function vercelRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const { token } = getVercelConfig();
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let message = `Vercel domain request failed (${response.status})`;

    try {
      const error = await response.json() as { error?: { message?: string }, message?: string };
      message = error.error?.message || error.message || message;
    } catch {
      // Ignore invalid JSON and use the default message.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

async function addProjectDomain(hostname: string) {
  return vercelRequest<VercelDomainRecord>(buildProjectDomainApiUrl("/domains"), {
    method: "POST",
    body: JSON.stringify({ name: hostname }),
  });
}

async function getProjectDomain(hostname: string) {
  return vercelRequest<VercelDomainRecord>(buildProjectDomainApiUrl(`/domains/${encodeURIComponent(hostname)}`));
}

async function verifyProjectDomain(hostname: string) {
  return vercelRequest<VercelDomainRecord>(buildProjectDomainApiUrl(`/domains/${encodeURIComponent(hostname)}/verify`), {
    method: "POST",
  });
}

async function getProjectDomainConfig(hostname: string) {
  return vercelRequest<VercelDomainConfigRecord>(buildDomainConfigApiUrl(hostname));
}

async function removeProjectDomain(hostname: string) {
  return vercelRequest<{ uid?: string }>(buildProjectDomainApiUrl(`/domains/${encodeURIComponent(hostname)}`), {
    method: "DELETE",
  });
}

function mapConfiguration(record: VercelDomainConfigRecord | null): DomainConfiguration | null {
  if (!record) {
    return null;
  }

  return {
    configuredBy: record.configuredBy ?? null,
    acceptedChallenges: record.acceptedChallenges ?? [],
    recommendedIPv4: record.recommendedIPv4 ?? [],
    recommendedCNAME: record.recommendedCNAME ?? [],
    misconfigured: Boolean(record.misconfigured),
  };
}

export async function ensureCustomDomainSchema() {
  if (!ensureCustomDomainSchemaPromise) {
    ensureCustomDomainSchemaPromise = (async () => {
      await queryAdmin(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
      await queryAdmin(`CREATE EXTENSION IF NOT EXISTS pg_session_jwt`);
      await queryAdmin(`
        CREATE TABLE IF NOT EXISTS "CustomDomain" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "userId" TEXT NOT NULL,
          hostname TEXT NOT NULL UNIQUE,
          "apexName" TEXT NOT NULL,
          status TEXT NOT NULL,
          verification JSONB,
          configuration JSONB,
          "verifiedAt" TIMESTAMPTZ,
          "lastCheckedAt" TIMESTAMPTZ,
          "isPrimary" BOOLEAN NOT NULL DEFAULT FALSE,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await queryAdmin(`ALTER TABLE "CustomDomain" ADD COLUMN IF NOT EXISTS configuration JSONB`);
      await queryAdmin(`CREATE INDEX IF NOT EXISTS "CustomDomain_userId_idx" ON "CustomDomain" ("userId")`);
      await queryAdmin(`CREATE INDEX IF NOT EXISTS "CustomDomain_status_idx" ON "CustomDomain" ("userId", status)`);
      await queryAdmin(`
        ALTER TABLE "QR"
        ADD COLUMN IF NOT EXISTS "customDomainId" UUID REFERENCES "CustomDomain"(id) ON DELETE SET NULL
      `);
      await queryAdmin(`CREATE INDEX IF NOT EXISTS "QR_customDomainId_idx" ON "QR" ("customDomainId")`);
      await queryAdmin(`GRANT USAGE ON SCHEMA public TO authenticated`);
      await queryAdmin(`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "CustomDomain" TO authenticated`);
      await queryAdmin(`
        DO $$
        BEGIN
          EXECUTE 'ALTER TABLE "CustomDomain" ENABLE ROW LEVEL SECURITY';

          IF NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public' AND tablename = 'CustomDomain' AND policyname = 'custom_domain_select_own'
          ) THEN
            EXECUTE 'CREATE POLICY custom_domain_select_own ON "CustomDomain" FOR SELECT TO authenticated USING (auth.user_id() = "userId")';
          END IF;

          IF NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public' AND tablename = 'CustomDomain' AND policyname = 'custom_domain_insert_own'
          ) THEN
            EXECUTE 'CREATE POLICY custom_domain_insert_own ON "CustomDomain" FOR INSERT TO authenticated WITH CHECK (auth.user_id() = "userId")';
          END IF;

          IF NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public' AND tablename = 'CustomDomain' AND policyname = 'custom_domain_update_own'
          ) THEN
            EXECUTE 'CREATE POLICY custom_domain_update_own ON "CustomDomain" FOR UPDATE TO authenticated USING (auth.user_id() = "userId") WITH CHECK (auth.user_id() = "userId")';
          END IF;

          IF NOT EXISTS (
            SELECT 1
            FROM pg_policies
            WHERE schemaname = 'public' AND tablename = 'CustomDomain' AND policyname = 'custom_domain_delete_own'
          ) THEN
            EXECUTE 'CREATE POLICY custom_domain_delete_own ON "CustomDomain" FOR DELETE TO authenticated USING (auth.user_id() = "userId")';
          END IF;
        END
        $$;
      `);
    })().catch((error) => {
      ensureCustomDomainSchemaPromise = null;
      throw error;
    });
  }

  await ensureCustomDomainSchemaPromise;
}

function mapCustomDomain(record: CustomDomainRow): CustomDomain {
  return {
    id: record.id,
    userId: record.userId,
    hostname: record.hostname,
    apexName: record.apexName,
    status: record.status,
    verification: record.verification,
    configuration: record.configuration,
    verifiedAt: record.verifiedAt,
    lastCheckedAt: record.lastCheckedAt,
    isPrimary: record.isPrimary,
    createdAt: record.createdAt,
  };
}

async function syncDomainRow(domain: Pick<CustomDomain, "id" | "userId" | "hostname">): Promise<CustomDomain | null> {
  await ensureCustomDomainSchema();

  let record: VercelDomainRecord | null = null;
  let configuration: DomainConfiguration | null = null;

  try {
    record = await getProjectDomain(domain.hostname);
  } catch (error) {
    console.error(`Failed to fetch Vercel domain state for ${domain.hostname}:`, error);
  }

  if (record?.verified) {
    try {
      configuration = mapConfiguration(await getProjectDomainConfig(domain.hostname));
    } catch (error) {
      console.error(`Failed to fetch Vercel domain config for ${domain.hostname}:`, error);
    }
  }

  const rows = await queryNoAuth<CustomDomainRow[]>(`
    UPDATE "CustomDomain"
    SET
      status = $1,
      verification = $2::jsonb,
      configuration = $3::jsonb,
      "verifiedAt" = $4,
      "lastCheckedAt" = NOW()
    WHERE id = $5 AND "userId" = $6
    RETURNING
      id,
      "userId",
      hostname,
      "apexName",
      status,
      verification,
      configuration,
      "verifiedAt",
      "lastCheckedAt",
      "isPrimary",
      "createdAt"
  `, [
    getStatus(record, configuration),
    JSON.stringify(getVerification(record)),
    JSON.stringify(configuration),
    record?.verified ? new Date().toISOString() : null,
    domain.id,
    domain.userId,
  ]);

  return rows[0] ? mapCustomDomain(rows[0]) : null;
}

export async function listCustomDomainsForUser(userId: string): Promise<CustomDomain[]> {
  await ensureCustomDomainSchema();
  const rows = await queryNoAuth<CustomDomainRow[]>(`
    SELECT
      id,
      "userId",
      hostname,
      "apexName",
      status,
      verification,
      configuration,
      "verifiedAt",
      "lastCheckedAt",
      "isPrimary",
      "createdAt"
    FROM "CustomDomain"
    WHERE "userId" = $1
    ORDER BY "createdAt" DESC
  `, [userId]);

  const synced = await Promise.all(rows.map((row) => syncDomainRow(mapCustomDomain(row))));
  return synced.filter((domain): domain is CustomDomain => Boolean(domain));
}

export async function listVerifiedCustomDomainsForUser(userId: string): Promise<CustomDomain[]> {
  await ensureCustomDomainSchema();
  const rows = await queryNoAuth<CustomDomainRow[]>(`
    SELECT
      id,
      "userId",
      hostname,
      "apexName",
      status,
      verification,
      configuration,
      "verifiedAt",
      "lastCheckedAt",
      "isPrimary",
      "createdAt"
    FROM "CustomDomain"
    WHERE "userId" = $1 AND status = 'ready'
    ORDER BY hostname ASC
  `, [userId]);

  return rows.map(mapCustomDomain);
}

export async function getCustomDomainByIdForUser(userId: string, id: string): Promise<CustomDomain | null> {
  await ensureCustomDomainSchema();
  const rows = await queryNoAuth<CustomDomainRow[]>(`
    SELECT
      id,
      "userId",
      hostname,
      "apexName",
      status,
      verification,
      configuration,
      "verifiedAt",
      "lastCheckedAt",
      "isPrimary",
      "createdAt"
    FROM "CustomDomain"
    WHERE id = $1 AND "userId" = $2
    LIMIT 1
  `, [id, userId]);

  return rows[0] ? syncDomainRow(mapCustomDomain(rows[0])) : null;
}

export async function ensureCustomDomainOwnedByUser(userId: string, customDomainId: string | null | undefined): Promise<string | null> {
  await ensureCustomDomainSchema();

  if (!customDomainId) {
    return null;
  }

  const rows = await queryNoAuth<{ id: string }[]>(`
    SELECT id
    FROM "CustomDomain"
    WHERE id = $1
      AND "userId" = $2
      AND status = 'ready'
    LIMIT 1
  `, [customDomainId, userId]);

  if (!rows[0]) {
    throw new Error("Custom domain not found or not ready");
  }

  return rows[0].id;
}

export async function createCustomDomainForUser(userId: string, rawHostname: string): Promise<CustomDomain> {
  await ensureCustomDomainSchema();

  const hostname = normalizeHostname(rawHostname);
  if (!isValidHostname(hostname)) {
    throw new Error("Invalid hostname");
  }

  const existing = await queryNoAuth<{ id: string }[]>(`
    SELECT id
    FROM "CustomDomain"
    WHERE hostname = $1
    LIMIT 1
  `, [hostname]);
  if (existing[0]) {
    throw new Error("That hostname is already connected");
  }

  let domainRecord: VercelDomainRecord | null = null;
  let configuration: DomainConfiguration | null = null;

  try {
    domainRecord = await addProjectDomain(hostname);
  } catch (error) {
    if (error instanceof Error && /already exists|already assigned|in use/i.test(error.message)) {
      domainRecord = await getProjectDomain(hostname);
    } else {
      throw error;
    }
  }

  if (!domainRecord) {
    domainRecord = await getProjectDomain(hostname);
  }
  if (domainRecord.verified) {
    configuration = mapConfiguration(await getProjectDomainConfig(hostname));
  }

  const inserted = await queryNoAuth<CustomDomainRow[]>(`
    INSERT INTO "CustomDomain" (
      "userId",
      hostname,
      "apexName",
      status,
      verification,
      configuration,
      "verifiedAt",
      "lastCheckedAt"
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5::jsonb,
      $6::jsonb,
      $7,
      NOW()
    )
    RETURNING
      id,
      "userId",
      hostname,
      "apexName",
      status,
      verification,
      configuration,
      "verifiedAt",
      "lastCheckedAt",
      "isPrimary",
      "createdAt"
  `, [
    userId,
    hostname,
    getApexName(hostname),
    getStatus(domainRecord, configuration),
    JSON.stringify(getVerification(domainRecord)),
    JSON.stringify(configuration),
    domainRecord.verified ? new Date().toISOString() : null,
  ]);

  return mapCustomDomain(inserted[0]);
}

export async function verifyCustomDomainForUser(userId: string, id: string): Promise<CustomDomain | null> {
  await ensureCustomDomainSchema();
  const domain = await getCustomDomainByIdForUser(userId, id);
  if (!domain) {
    return null;
  }

  let record: VercelDomainRecord | null = null;
  let configuration: DomainConfiguration | null = null;

  try {
    record = await verifyProjectDomain(domain.hostname);
  } catch (error) {
    if (error instanceof Error && /already verified/i.test(error.message)) {
      record = await getProjectDomain(domain.hostname);
    } else {
      throw error;
    }
  }

  if (!record) {
    record = await getProjectDomain(domain.hostname);
  }
  if (record.verified) {
    configuration = mapConfiguration(await getProjectDomainConfig(domain.hostname));
  }

  const rows = await queryNoAuth<CustomDomainRow[]>(`
    UPDATE "CustomDomain"
    SET
      status = $1,
      verification = $2::jsonb,
      configuration = $3::jsonb,
      "verifiedAt" = $4,
      "lastCheckedAt" = NOW()
    WHERE id = $5 AND "userId" = $6
    RETURNING
      id,
      "userId",
      hostname,
      "apexName",
      status,
      verification,
      configuration,
      "verifiedAt",
      "lastCheckedAt",
      "isPrimary",
      "createdAt"
  `, [
    getStatus(record, configuration),
    JSON.stringify(getVerification(record)),
    JSON.stringify(configuration),
    record.verified ? new Date().toISOString() : null,
    id,
    userId,
  ]);

  return rows[0] ? mapCustomDomain(rows[0]) : null;
}

export async function deleteCustomDomainForUser(userId: string, id: string): Promise<boolean> {
  await ensureCustomDomainSchema();
  const domain = await getCustomDomainByIdForUser(userId, id);
  if (!domain) {
    return false;
  }

  await queryNoAuth(`
    UPDATE "CustomDomain"
    SET status = 'removing', "lastCheckedAt" = NOW()
    WHERE id = $1 AND "userId" = $2
  `, [id, userId]);

  await removeProjectDomain(domain.hostname);
  const deleted = await queryNoAuth<{ id: string }[]>(`
    DELETE FROM "CustomDomain"
    WHERE id = $1 AND "userId" = $2
    RETURNING id
  `, [id, userId]);

  return deleted.length > 0;
}
