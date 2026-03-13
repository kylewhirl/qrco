import "server-only";

import { NextRequest } from "next/server";
import { getApiKeyRecord, touchApiKeyLastUsed } from "@/lib/api-keys";

export interface ApiKeyAuthResult {
  apiKeyId: string
  userId: string
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

export async function authenticateApiKeyRequest(request: NextRequest): Promise<ApiKeyAuthResult | null> {
  const token = extractBearerToken(request);
  if (!token) {
    return null;
  }

  const record = await getApiKeyRecord(token);
  if (!record) {
    return null;
  }

  await touchApiKeyLastUsed(record.id);

  return {
    apiKeyId: record.id,
    userId: record.userId,
  };
}
