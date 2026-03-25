import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { getApiKeyRecord, touchApiKeyLastUsed } from "@/lib/api-keys";
import type { ApiAccessScope, ApiTokenKind } from "@/lib/types";

export interface ApiKeyAuthResult {
  apiKeyId: string;
  userId: string;
  kind: ApiTokenKind;
  scopes: ApiAccessScope[];
  allowedOrigins: string[] | null;
  origin: string | null;
}

export interface ApiRequestAuthorization {
  auth: ApiKeyAuthResult;
  corsHeaders: Record<string, string>;
}

function extractBearerToken(request: NextRequest) {
  const header = request.headers.get("authorization");
  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token.trim();
}

function normalizeOrigin(originHeader: string | null) {
  if (!originHeader) {
    return null;
  }

  try {
    return new URL(originHeader).origin;
  } catch {
    return null;
  }
}

function buildCorsHeaders(origin: string | null): Record<string, string> {
  if (!origin) {
    return {};
  }

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function buildApiPreflightResponse(request: NextRequest) {
  const origin = normalizeOrigin(request.headers.get("origin"));
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(origin ?? "*"),
  });
}

export async function authenticateApiKeyRequest(request: NextRequest): Promise<ApiKeyAuthResult | null> {
  const token = extractBearerToken(request);
  if (!token) {
    return null;
  }

  const record = await getApiKeyRecord(token);
  if (!record) {
    return null;
  }

  const origin = normalizeOrigin(request.headers.get("origin"));

  if (record.kind === "publishable") {
    if (!origin) {
      return null;
    }
  }

  const allowedOrigins = record.allowedOrigins ?? [];
  if (origin && allowedOrigins.length > 0 && !allowedOrigins.includes(origin)) {
    return null;
  }

  await touchApiKeyLastUsed(record.id);

  return {
    apiKeyId: record.id,
    userId: record.userId,
    kind: record.kind,
    scopes: record.scopes,
    allowedOrigins: record.allowedOrigins,
    origin,
  };
}

export async function authorizeApiRequest(
  request: NextRequest,
  requiredScopes: ApiAccessScope[],
): Promise<{ ok: true; value: ApiRequestAuthorization } | { ok: false; response: NextResponse }> {
  const requestOrigin = normalizeOrigin(request.headers.get("origin"));
  const auth = await authenticateApiKeyRequest(request);
  if (!auth) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, {
        status: 401,
        headers: buildCorsHeaders(requestOrigin),
      }),
    };
  }

  const missingScope = requiredScopes.find((scope) => !auth.scopes.includes(scope));
  if (missingScope) {
    return {
      ok: false,
      response: NextResponse.json({ error: `Missing required scope: ${missingScope}` }, {
        status: 403,
        headers: buildCorsHeaders(auth.origin),
      }),
    };
  }

  return {
    ok: true,
    value: {
      auth,
      corsHeaders: buildCorsHeaders(auth.origin),
    },
  };
}
