import { query } from './db'
import { StackServerApp } from '@stackframe/stack'

const stackServerApp = new StackServerApp({
  tokenStore: 'nextjs-cookie',
  urls: { signIn: '/login' },
})

export interface DomainEntry {
  id: string
  user_id: string
  name: string
  status: string
}

export async function saveDomain(userId: string, name: string, status: string) {
  try {
    await query<DomainEntry[]>(
      'INSERT INTO "Domain" (user_id, name, status) VALUES ($1, $2, $3) RETURNING *',
      [userId, name, status],
    )
  } catch (error) {
    console.error('Failed to save domain', error)
  }
}

export async function getDomains(): Promise<DomainEntry[]> {
  const user = await stackServerApp.getUser()
  if (!user) return []
  return await query<DomainEntry[]>(
    'SELECT * FROM "Domain" WHERE user_id = $1 ORDER BY created_at DESC',
    [user.id],
  )
}

export async function getTenantByDomain(domain: string): Promise<string | null> {
  const result = await query<{ user_id: string }[]>(
    'SELECT user_id FROM "Domain" WHERE name = $1 LIMIT 1',
    [domain],
  )
  return result.length ? result[0].user_id : null
}
