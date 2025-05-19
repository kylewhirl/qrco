import { neon } from "@neondatabase/serverless"
import { StackServerApp } from "@stackframe/stack"

const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  urls: {
    signIn: '/login',
  },
})


// Helper to get an authenticated Neon client
function getSql() {
  return neon(process.env.DATABASE_AUTHENTICATED_URL!, {
    authToken: async () => {
      const user = await stackServerApp.getUser();
      if (!user) throw new Error('Unauthorized');
      const { accessToken } = await user.getAuthJson();
      if (!accessToken) {
        throw new Error('No authentication token available');
      }
      return accessToken;
    },
  });
}

// Export a type-safe query function
export async function query<T>(queryString: string, params: unknown[] = []): Promise<T> {
  try {
    const result = await getSql().query(queryString, params)
    return result as T
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}

// Export a type-safe query function
export async function queryNoAuth<T>(queryString: string, params: unknown[] = []): Promise<T> {
  try {
    const result = await neon(process.env.DATABASE_URL!).query(queryString, params)
    return result as T
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}


