import "server-only";

import { neon } from "@neondatabase/serverless";
import { stackServerApp } from "@/stack";

function getAuthenticatedSql(authToken: string) {
  return neon(process.env.DATABASE_AUTHENTICATED_URL!, {
    authToken,
  });
}

function getAdminSql() {
  return neon(process.env.DATABASE_URL!);
}

async function getCurrentAuthToken(): Promise<string | null> {
  const user = await stackServerApp.getUser();
  if (!user) {
    return null;
  }

  const { accessToken } = await user.getAuthJson();
  return accessToken ?? null;
}

export async function query<T>(queryString: string, params: unknown[] = []): Promise<T> {
  const authToken = await getCurrentAuthToken();
  if (!authToken) {
    throw new Error("Authenticated database access requires a signed-in user");
  }

  try {
    const result = await getAuthenticatedSql(authToken).query(queryString, params);
    return result as T;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

export async function queryAdmin<T>(queryString: string, params: unknown[] = []): Promise<T> {
  try {
    const result = await getAdminSql().query(queryString, params);
    return result as T;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

// Prefer the authenticated Neon connection when a Stack session is present.
// This keeps dashboard traffic inside DB-enforced auth/RLS while preserving
// explicit service-role access for API-key and public request flows.
export async function queryNoAuth<T>(queryString: string, params: unknown[] = []): Promise<T> {
  const authToken = await getCurrentAuthToken();

  try {
    const sql = authToken ? getAuthenticatedSql(authToken) : getAdminSql();
    const result = await sql.query(queryString, params);
    return result as T;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

