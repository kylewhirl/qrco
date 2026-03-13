import { queryAdmin, queryNoAuth } from "./db"
import type { DailyScanCount, DashboardMetrics, LatestScan, QR, TopLocation, QRData } from "./types"
import { generateQRCode, getLocationFromIP } from "./utils"
import { StackServerApp } from "@stackframe/stack";
import { buildPublicQrUrl, isPrimaryAppHost, normalizeHostname } from "./qr-url";
import { ensureCustomDomainOwnedByUser, ensureCustomDomainSchema } from "./custom-domains";

const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  urls: { signIn: "/login" },
})

let ensureQrAccessPromise: Promise<void> | null = null;

async function ensureQrAccess() {
  if (!ensureQrAccessPromise) {
    ensureQrAccessPromise = (async () => {
      await queryAdmin(`CREATE EXTENSION IF NOT EXISTS pg_session_jwt`);
      await queryAdmin(`GRANT USAGE ON SCHEMA public TO authenticated`);
      await queryAdmin(`
        DO $$
        BEGIN
          IF to_regclass('public."QR"') IS NOT NULL THEN
            EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "QR" TO authenticated';
            EXECUTE 'ALTER TABLE "QR" ENABLE ROW LEVEL SECURITY';
            EXECUTE 'DROP POLICY IF EXISTS qr_select_own ON "QR"';
            EXECUTE 'DROP POLICY IF EXISTS qr_insert_own ON "QR"';
            EXECUTE 'DROP POLICY IF EXISTS qr_update_own ON "QR"';
            EXECUTE 'DROP POLICY IF EXISTS qr_delete_own ON "QR"';
            EXECUTE 'CREATE POLICY qr_select_own ON "QR" FOR SELECT TO authenticated USING (auth.user_id()::text = user_id::text)';
            EXECUTE 'CREATE POLICY qr_insert_own ON "QR" FOR INSERT TO authenticated WITH CHECK (auth.user_id()::text = user_id::text)';
            EXECUTE 'CREATE POLICY qr_update_own ON "QR" FOR UPDATE TO authenticated USING (auth.user_id()::text = user_id::text) WITH CHECK (auth.user_id()::text = user_id::text)';
            EXECUTE 'CREATE POLICY qr_delete_own ON "QR" FOR DELETE TO authenticated USING (auth.user_id()::text = user_id::text)';
          END IF;

          IF to_regclass('public."Scan"') IS NOT NULL THEN
            EXECUTE 'GRANT SELECT, INSERT ON TABLE "Scan" TO authenticated';
            EXECUTE 'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated';
            EXECUTE 'ALTER TABLE "Scan" ENABLE ROW LEVEL SECURITY';
            EXECUTE 'DROP POLICY IF EXISTS scan_select_own ON "Scan"';
            EXECUTE 'DROP POLICY IF EXISTS scan_insert_own ON "Scan"';
            EXECUTE 'CREATE POLICY scan_select_own ON "Scan" FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM "QR" q WHERE q.id = "qrId" AND q.user_id::text = auth.user_id()::text))';
            EXECUTE 'CREATE POLICY scan_insert_own ON "Scan" FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM "QR" q WHERE q.id = "qrId" AND q.user_id::text = auth.user_id()::text))';
          END IF;
        END
        $$;
      `);
    })().catch((error) => {
      ensureQrAccessPromise = null;
      throw error;
    });
  }

  await ensureQrAccessPromise;
}

async function ensureQrDataAccess() {
  await Promise.all([ensureCustomDomainSchema(), ensureQrAccess()]);
}

async function requireCurrentUserId() {
  const user = await stackServerApp.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  return user.id;
}

async function generateUniqueCode() {
  await ensureQrDataAccess();
  let code = generateQRCode();

  while (true) {
    const existingCode = await queryNoAuth<QR[]>('SELECT id FROM "QR" WHERE code = $1 LIMIT 1', [code]);
    if (existingCode.length === 0) {
      return code;
    }

    code = generateQRCode();
  }
}

type QRRow = QR & { customHostname?: string | null };

function mapQR(record: QRRow): QR {
  return {
    ...record,
    customDomainId: record.customDomainId ?? null,
    customHostname: record.customHostname ?? null,
    publicUrl: buildPublicQrUrl(record.code, record.customHostname ?? null),
  };
}

async function getQRByIdInternal(id: string, userId?: string): Promise<QR | null> {
  await ensureQrDataAccess();
  const params: unknown[] = [id];
  let where = 'q.id = $1';

  if (userId) {
    params.push(userId);
    where += ` AND q.user_id = $${params.length}`;
  }

  const result = await queryNoAuth<QRRow[]>(
    `SELECT q.*, d.hostname AS "customHostname"
     FROM "QR" q
     LEFT JOIN "CustomDomain" d ON d.id = q."customDomainId"
     WHERE ${where}
     LIMIT 1`,
    params,
  );

  return result[0] ? mapQR(result[0]) : null;
}

export async function createQRCodeForUser(userId: string, data: QRData, customDomainId?: string | null): Promise<QR> {
  const code = await generateUniqueCode();
  const resolvedCustomDomainId = await ensureCustomDomainOwnedByUser(userId, customDomainId);
  const result = await queryNoAuth<{ id: string }[]>(
    'INSERT INTO "QR" (code, data, user_id, "customDomainId") VALUES ($1, $2::jsonb, $3, $4) RETURNING id',
    [code, JSON.stringify(data), userId, resolvedCustomDomainId],
  );

  const qr = await getQRByIdInternal(result[0].id);
  if (!qr) {
    throw new Error("Failed to load created QR code");
  }

  return qr;
}

export async function createQRCode(data: QRData, customDomainId?: string | null): Promise<QR> {
  const userId = await requireCurrentUserId();
  return createQRCodeForUser(userId, data, customDomainId);
}

export async function getQRByHostAndCode(hostname: string, code: string): Promise<QR | null> {
  await ensureQrDataAccess();
  const normalizedHost = normalizeHostname(hostname);

  const result = isPrimaryAppHost(normalizedHost)
    ? await queryNoAuth<QRRow[]>(
        `SELECT q.*, d.hostname AS "customHostname"
         FROM "QR" q
         LEFT JOIN "CustomDomain" d ON d.id = q."customDomainId"
         WHERE q.code = $1
         LIMIT 1`,
        [code],
      )
    : await queryNoAuth<QRRow[]>(
        `SELECT q.*, d.hostname AS "customHostname"
         FROM "QR" q
         JOIN "CustomDomain" d ON d.id = q."customDomainId"
         WHERE q.code = $1
           AND d.hostname = $2
           AND d.status = 'ready'
         LIMIT 1`,
        [code, normalizedHost],
      );

  return result[0] ? mapQR(result[0]) : null;
}

export async function getQRByIdForUser(userId: string, id: string): Promise<QR | null> {
  return getQRByIdInternal(id, userId);
}

export async function getQRById(id: string): Promise<QR | null> {
  const userId = await requireCurrentUserId();
  return getQRByIdForUser(userId, id);
}

export async function updateQRDataForUser(userId: string, id: string, data: QRData, customDomainId?: string | null): Promise<QR | null> {
  const resolvedCustomDomainId = await ensureCustomDomainOwnedByUser(userId, customDomainId);
  const result = await queryNoAuth<{ id: string }[]>(
    'UPDATE "QR" SET data = $1::jsonb, "customDomainId" = $2 WHERE id = $3 AND user_id = $4 RETURNING id',
    [JSON.stringify(data), resolvedCustomDomainId, id, userId],
  );

  return result[0] ? getQRByIdInternal(result[0].id, userId) : null;
}

export async function updateQRData(id: string, data: QRData, customDomainId?: string | null): Promise<QR | null> {
  const userId = await requireCurrentUserId();
  return updateQRDataForUser(userId, id, data, customDomainId);
}

export async function deleteQRForUser(userId: string, id: string): Promise<boolean> {
  await ensureQrDataAccess();
  const result = await queryNoAuth<{ id: string }[]>(
    'DELETE FROM "QR" WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId],
  );

  return result.length > 0;
}

export async function deleteQR(id: string): Promise<boolean> {
  const userId = await requireCurrentUserId();
  return deleteQRForUser(userId, id);
}

export async function logScan(qrId: string, ip: string): Promise<void> {
  await ensureQrDataAccess();
  const location = await getLocationFromIP(ip);

  await queryNoAuth<void>('INSERT INTO "Scan" ("qrId", ip, location) VALUES ($1, $2, $3)', [qrId, ip, location]);
  await queryNoAuth<void>('UPDATE "QR" SET "totalScans" = "totalScans" + 1, "lastScanned" = CURRENT_TIMESTAMP WHERE id = $1', [qrId]);
}

export async function getAllQRCodesForUser(userId: string): Promise<QR[]> {
  await ensureQrDataAccess();
  const rows = await queryNoAuth<QRRow[]>(
    `SELECT q.*, d.hostname AS "customHostname"
     FROM "QR" q
     LEFT JOIN "CustomDomain" d ON d.id = q."customDomainId"
     WHERE q.user_id = $1
     ORDER BY q."createdAt" DESC`,
    [userId],
  );

  return rows.map(mapQR);
}

export async function getAllQRCodes(): Promise<QR[]> {
  const userId = await requireCurrentUserId();
  return getAllQRCodesForUser(userId);
}

export async function getRecentQRCodesForUser(userId: string, limit = 10): Promise<QR[]> {
  await ensureQrDataAccess();
  const rows = await queryNoAuth<QRRow[]>(
    `SELECT
       q.id,
       q.code,
       q.data,
       q."customDomainId",
       q."createdAt",
       q."totalScans",
       q."lastScanned",
       d.hostname AS "customHostname"
     FROM "QR" q
     LEFT JOIN "CustomDomain" d ON d.id = q."customDomainId"
     WHERE q.user_id = $1
     ORDER BY q."createdAt" DESC
     LIMIT $2`,
    [userId, limit],
  );

  return rows.map(mapQR);
}

export async function getRecentQRCodes(limit = 10): Promise<QR[]> {
  const userId = await requireCurrentUserId();
  return getRecentQRCodesForUser(userId, limit);
}

export async function getDashboardMetricsForUser(userId: string): Promise<DashboardMetrics> {
  await ensureQrDataAccess();
  const totalScansResult = await queryNoAuth<{ count: string }[]>(
    `SELECT COUNT(*)::text as count
     FROM "Scan" s
     JOIN "QR" q ON q.id = s."qrId"
     WHERE q.user_id = $1
       AND s."scannedAt" > NOW() - INTERVAL '7 days'`,
    [userId],
  );
  const totalScansLast7Days = Number.parseInt(totalScansResult[0]?.count || "0");

  const activeQRCodesResult = await queryNoAuth<{ count: string }[]>(
    'SELECT COUNT(*)::text as count FROM "QR" WHERE user_id = $1',
    [userId],
  );
  const activeQRCodesCount = Number.parseInt(activeQRCodesResult[0]?.count || "0");

  const topLocationResult = await queryNoAuth<TopLocation[]>(
    `SELECT s.location, COUNT(*)::int as count
     FROM "Scan" s
     JOIN "QR" q ON q.id = s."qrId"
     WHERE q.user_id = $1
       AND s.location IS NOT NULL
     GROUP BY s.location
     ORDER BY count DESC
     LIMIT 1`,
    [userId],
  );
  const topLocation = topLocationResult[0] ?? null;

  const mostActiveQRResult = await queryNoAuth<{ code: string; data: QRData; scans: number }[]>(
    `SELECT q.code, q.data, q."totalScans" as scans
     FROM "QR" q
     WHERE q.user_id = $1
     ORDER BY q."totalScans" DESC, q."createdAt" DESC
     LIMIT 1`,
    [userId],
  );
  const mostActiveQR = mostActiveQRResult[0] ?? null;

  return {
    totalScansLast7Days,
    activeQRCodesCount,
    topLocation,
    mostActiveQR,
  };
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const userId = await requireCurrentUserId();
  return getDashboardMetricsForUser(userId);
}

export async function getDailyScanCountsForUser(userId: string): Promise<DailyScanCount[]> {
  await ensureQrDataAccess();
  const result = await queryNoAuth<{ date: string; count: string }[]>(
    `SELECT
       TO_CHAR(s."scannedAt"::date, 'YYYY-MM-DD') as date,
       COUNT(*)::text as count
     FROM "Scan" s
     JOIN "QR" q ON q.id = s."qrId"
     WHERE q.user_id = $1
       AND s."scannedAt" > NOW() - INTERVAL '30 days'
     GROUP BY date
     ORDER BY date ASC`,
    [userId],
  );

  return result.map((item) => ({
    date: item.date,
    count: Number.parseInt(item.count),
  }));
}

export async function getDailyScanCounts(): Promise<DailyScanCount[]> {
  const userId = await requireCurrentUserId();
  return getDailyScanCountsForUser(userId);
}

export async function getDailyScanCountsByQRCodeForUser(userId: string, qrId: string): Promise<DailyScanCount[]> {
  await ensureQrDataAccess();
  const result = await queryNoAuth<{ date: string; count: string }[]>(
    `SELECT
       TO_CHAR(s."scannedAt"::date, 'YYYY-MM-DD') as date,
       COUNT(*)::text as count
     FROM "Scan" s
     JOIN "QR" q ON q.id = s."qrId"
     WHERE q.user_id = $1
       AND q.id = $2
       AND s."scannedAt" > NOW() - INTERVAL '30 days'
     GROUP BY date
     ORDER BY date ASC`,
    [userId, qrId],
  );

  return result.map((item) => ({
    date: item.date,
    count: Number.parseInt(item.count),
  }));
}

export async function getDailyScanCountsByQRCode(qrId: string): Promise<DailyScanCount[]> {
  const userId = await requireCurrentUserId();
  return getDailyScanCountsByQRCodeForUser(userId, qrId);
}

export async function getTopLocationsForUser(userId: string, limit = 5): Promise<TopLocation[]> {
  await ensureQrDataAccess();
  return queryNoAuth<TopLocation[]>(
    `SELECT s.location, COUNT(*)::int as count
     FROM "Scan" s
     JOIN "QR" q ON q.id = s."qrId"
     WHERE q.user_id = $1
       AND s.location IS NOT NULL
     GROUP BY s.location
     ORDER BY count DESC
     LIMIT $2`,
    [userId, limit],
  );
}

export async function getTopLocations(limit = 5): Promise<TopLocation[]> {
  const userId = await requireCurrentUserId();
  return getTopLocationsForUser(userId, limit);
}

export async function getTopLocationsByQRCodeForUser(userId: string, qrId: string, limit = 5): Promise<TopLocation[]> {
  await ensureQrDataAccess();
  return queryNoAuth<TopLocation[]>(
    `SELECT s.location, COUNT(*)::int as count
     FROM "Scan" s
     JOIN "QR" q ON q.id = s."qrId"
     WHERE q.user_id = $1
       AND q.id = $2
       AND s.location IS NOT NULL
     GROUP BY s.location
     ORDER BY count DESC
     LIMIT $3`,
    [userId, qrId, limit],
  );
}

export async function getTopLocationsByQRCode(qrId: string, limit = 5): Promise<TopLocation[]> {
  const userId = await requireCurrentUserId();
  return getTopLocationsByQRCodeForUser(userId, qrId, limit);
}

export async function getLatestScansForUser(userId: string, limit = 10): Promise<LatestScan[]> {
  await ensureQrDataAccess();
  return queryNoAuth<LatestScan[]>(
    `SELECT s.id, q.code, q.data, s."scannedAt", s.location
     FROM "Scan" s
     JOIN "QR" q ON s."qrId" = q.id
     WHERE q.user_id = $1
     ORDER BY s."scannedAt" DESC
     LIMIT $2`,
    [userId, limit],
  );
}

export async function getLatestScans(limit = 10): Promise<LatestScan[]> {
  const userId = await requireCurrentUserId();
  return getLatestScansForUser(userId, limit);
}

export async function getLatestScansByQRCodeForUser(userId: string, qrId?: string, limit = 100): Promise<LatestScan[]> {
  await ensureQrDataAccess();
  if (qrId) {
    return queryNoAuth<LatestScan[]>(
      `SELECT s.id, q.code, q.data, s."scannedAt", s.location
       FROM "Scan" s
       JOIN "QR" q ON s."qrId" = q.id
       WHERE q.user_id = $1
         AND q.id = $2
       ORDER BY s."scannedAt" DESC
       LIMIT $3`,
      [userId, qrId, limit],
    );
  }

  return getLatestScansForUser(userId, limit);
}

export async function getLatestScansByQRCode(qrId?: string, limit = 100): Promise<LatestScan[]> {
  const userId = await requireCurrentUserId();
  return getLatestScansByQRCodeForUser(userId, qrId, limit);
}

export async function getQRByCodeForUser(userId: string, code: string): Promise<QR | null> {
  await ensureQrDataAccess();
  const result = await queryNoAuth<QRRow[]>(
    `SELECT q.*, d.hostname AS "customHostname"
     FROM "QR" q
     LEFT JOIN "CustomDomain" d ON d.id = q."customDomainId"
     WHERE q.code = $1 AND q.user_id = $2
     LIMIT 1`,
    [code, userId],
  );

  return result[0] ? mapQR(result[0]) : null;
}

export async function attachUploadedFileToQrForUser(userId: string, code: string, key: string): Promise<QR | null> {
  await ensureQrDataAccess();
  const result = await queryNoAuth<{ id: string }[]>(
    `UPDATE "QR"
     SET data = jsonb_set(data, '{key}', to_jsonb($3::text), true)
     WHERE code = $1
       AND user_id = $2
       AND data->>'type' = 'file'
     RETURNING id`,
    [code, userId, key],
  );

  return result[0] ? getQRByIdInternal(result[0].id, userId) : null;
}
