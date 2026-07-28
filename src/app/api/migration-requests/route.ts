import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { queryAdmin } from "@/lib/db";

export const runtime = "nodejs";

const migrationRequestSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  company: z.string().trim().min(1).max(160),
  provider: z.string().trim().min(1).max(80),
  qrUrl: z.string().trim().url().max(2048),
  qrCount: z.string().trim().min(1).max(24),
  customDomain: z.enum(["yes", "no", "not_sure"]),
  notes: z.string().trim().max(2000).optional().default(""),
});

type MigrationRequest = z.infer<typeof migrationRequestSchema>;

async function ensureMigrationRequestTable() {
  await queryAdmin(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
  await queryAdmin(`
    CREATE TABLE IF NOT EXISTS "MigrationRequest" (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      company TEXT NOT NULL,
      provider TEXT NOT NULL,
      "qrUrl" TEXT NOT NULL,
      "qrCount" TEXT NOT NULL,
      "customDomain" TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'new',
      "sourcePath" TEXT NOT NULL DEFAULT '/qr-migration',
      "userAgent" TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await queryAdmin(`CREATE INDEX IF NOT EXISTS "MigrationRequest_createdAt_idx" ON "MigrationRequest" ("createdAt" DESC)`);
  await queryAdmin(`CREATE INDEX IF NOT EXISTS "MigrationRequest_email_idx" ON "MigrationRequest" (email)`);
}

async function notifyByResend(input: MigrationRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.MIGRATION_REQUEST_NOTIFY_TO;
  const from = process.env.MIGRATION_REQUEST_NOTIFY_FROM ?? "The QR Code Co <onboarding@resend.dev>";

  if (!apiKey || !to) {
    return;
  }

  const lines = [
    "New QR migration request",
    "",
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Company: ${input.company}`,
    `Provider: ${input.provider}`,
    `QR link: ${input.qrUrl}`,
    `QR count: ${input.qrCount}`,
    `Custom domain: ${input.customDomain}`,
    "",
    "Notes:",
    input.notes || "None provided",
  ];

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      reply_to: input.email,
      subject: `QR migration request from ${input.company}`,
      text: lines.join("\n"),
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error("Failed to send migration request notification:", response.status, body);
  }
}

export async function POST(request: NextRequest) {
  const parsed = migrationRequestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Please complete the required fields with valid information." }, { status: 400 });
  }

  try {
    await ensureMigrationRequestTable();

    const userAgent = request.headers.get("user-agent");
    const [record] = await queryAdmin<{ id: string }[]>(
      `
        INSERT INTO "MigrationRequest" (
          name,
          email,
          company,
          provider,
          "qrUrl",
          "qrCount",
          "customDomain",
          notes,
          "userAgent"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `,
      [
        parsed.data.name,
        parsed.data.email,
        parsed.data.company,
        parsed.data.provider,
        parsed.data.qrUrl,
        parsed.data.qrCount,
        parsed.data.customDomain,
        parsed.data.notes,
        userAgent,
      ],
    );

    await notifyByResend(parsed.data);

    return NextResponse.json({ id: record.id }, { status: 201 });
  } catch (error) {
    console.error("Failed to create migration request:", error);
    return NextResponse.json({ error: "Migration request could not be saved." }, { status: 500 });
  }
}
