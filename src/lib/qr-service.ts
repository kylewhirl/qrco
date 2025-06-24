import { query, queryNoAuth } from "./db"
import type { DailyScanCount, DashboardMetrics, LatestScan, QR, TopLocation, QRData } from "./types"
import { generateQRCode, getLocationFromIP } from "./utils"
import { StackServerApp } from "@stackframe/stack";

const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  urls: { signIn: "/login" },
})

// Create a new QR code
export async function createQRCode(data: QRData, domainId: string | null = null): Promise<QR> {
  const user = await stackServerApp.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  // Generate a unique code
  let code = generateQRCode()
  let isUnique = false

  // Ensure the code is unique
  while (!isUnique) {
    const existingCode = await query<QR[]>('SELECT * FROM "QR" WHERE code = $1', [code])
    if (existingCode.length === 0) {
      isUnique = true
    } else {
      code = generateQRCode()
    }
  }

  const result = await query<QR[]>(
    'INSERT INTO "QR" (code, data, user_id, domain_id) VALUES ($1, $2::jsonb, $3, $4) RETURNING *',
    [code, data, user.id, domainId]
  )

  return result[0]
}

// Get QR code by code
export async function getQRByCode(code: string, domainId: string): Promise<QR | null> {
  let result: QR[] = []
  if (domainId) {
    result = await queryNoAuth<QR[]>(
      'SELECT * FROM "QR" WHERE code = $1 AND domain_id = $2',
      [code, domainId]
    )
  } else {
    result = await queryNoAuth<QR[]>(
      'SELECT * FROM "QR" WHERE code = $1 AND domain_id IS NULL',
      [code]
    )
  }
  return result.length > 0 ? result[0] : null
}

// Get QR code by ID
export async function getQRById(id: string): Promise<QR | null> {
  const result = await query<QR[]>('SELECT * FROM "QR" WHERE id = $1', [id])
  return result.length > 0 ? result[0] : null
}

// Update QR code data
export async function updateQRData(id: string, data: QRData): Promise<QR | null> {
  const result = await query<QR[]>(
    'UPDATE "QR" SET data = $1 WHERE id = $2 RETURNING *',
    [JSON.stringify(data), id]
  )
  return result.length > 0 ? result[0] : null
}

// Delete QR code
export async function deleteQR(id: string): Promise<boolean> {
  const result = await query<{ id: string }[]>('DELETE FROM "QR" WHERE id = $1 RETURNING id', [id])
  return result.length > 0
}

// Log a scan
export async function logScan(qrId: string, ip: string): Promise<void> {
  const location = await getLocationFromIP(ip)

  console.log("Logging scan for QR id:", qrId);

  // Insert scan record
  await queryNoAuth<void>('INSERT INTO "Scan" ("qrId", ip, location) VALUES ($1, $2, $3)', [qrId, ip, location])

  // Update QR code stats
  await queryNoAuth<void>('UPDATE "QR" SET "totalScans" = "totalScans" + 1, "lastScanned" = CURRENT_TIMESTAMP WHERE id = $1', [qrId])
}

// Get all QR codes
export async function getAllQRCodes(): Promise<QR[]> {  
  return await query<QR[]>('SELECT * FROM "QR" ORDER BY "createdAt" DESC')
}

// Get recent QR codes
export async function getRecentQRCodes(limit = 10): Promise<QR[]> {
  console.log("Fetching recent QR codes")
  return await query<QR[]>(
    'SELECT id, code, data, "createdAt", "totalScans" FROM "QR" ORDER BY "createdAt" DESC LIMIT $1',
    [limit],
  )
}

// Get dashboard metrics
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  // Total scans in the last 7 days
  const totalScansResult = await query<{ count: string }[]>(
    'SELECT COUNT(*) as count FROM "Scan" WHERE "scannedAt" > NOW() - INTERVAL \'7 days\'',
    [],
  )
  const totalScansLast7Days = Number.parseInt(totalScansResult[0]?.count || "0")

  // Active QR codes count
  const activeQRCodesResult = await query<{ count: string }[]>('SELECT COUNT(*) as count FROM "QR"', [])
  const activeQRCodesCount = Number.parseInt(activeQRCodesResult[0]?.count || "0")

  // Top location by scan count
  const topLocationResult = await query<TopLocation[]>(
    'SELECT location, COUNT(*) as count FROM "Scan" WHERE location IS NOT NULL GROUP BY location ORDER BY count DESC LIMIT 1',
    [],
  )
  const topLocation = topLocationResult.length > 0 ? topLocationResult[0] : null

  // Most active QR code
  const mostActiveQRResult = await query<{ code: string; data: QRData; scans: number }[]>(
    'SELECT q.code, q.data, q."totalScans" as scans FROM "QR" q ORDER BY q."totalScans" DESC LIMIT 1',
    [],
  )
  const mostActiveQR = mostActiveQRResult.length > 0 ? mostActiveQRResult[0] : null

  return {
    totalScansLast7Days,
    activeQRCodesCount,
    topLocation,
    mostActiveQR,
  }
}

// Get daily scan counts for the past 30 days
export async function getDailyScanCounts(): Promise<DailyScanCount[]> {
  const result = await query<{ date: string; count: string }[]>(
    `SELECT 
      TO_CHAR("scannedAt"::date, 'YYYY-MM-DD') as date,
      COUNT(*) as count
    FROM "Scan"
    WHERE "scannedAt" > NOW() - INTERVAL '30 days'
    GROUP BY date
    ORDER BY date ASC`,
    [],
  )

  return result.map((item) => ({
    date: item.date,
    count: Number.parseInt(item.count),
  }))
}

// Get top locations
export async function getTopLocations(limit = 5): Promise<TopLocation[]> {
  return await query<TopLocation[]>(
    'SELECT location, COUNT(*) as count FROM "Scan" WHERE location IS NOT NULL GROUP BY location ORDER BY count DESC LIMIT $1',
    [limit],
  )
}

// Get latest scans
export async function getLatestScans(limit = 10): Promise<LatestScan[]> {
  return await query<LatestScan[]>(
    `SELECT s.id, q.code, q.data, s."scannedAt", s.location
    FROM "Scan" s
    JOIN "QR" q ON s."qrId" = q.id
    ORDER BY s."scannedAt" DESC
    LIMIT $1`,
    [limit],
  )
}
