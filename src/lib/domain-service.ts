import { query, queryNoAuth } from './db'
import { StackServerApp } from '@stackframe/stack'
import type { Domain } from './types'
import crypto from 'crypto'

const stackServerApp = new StackServerApp({
  tokenStore: 'nextjs-cookie',
  urls: { signIn: '/login' },
})

export async function createDomain(name: string): Promise<Domain> {
  const user = await stackServerApp.getUser()
  if (!user) throw new Error('Unauthorized')
  const token = crypto.randomUUID()
  const result = await query<Domain[]>(
    'INSERT INTO "Domain" (user_id, domain, verified, "verificationToken") VALUES ($1, $2, false, $3) RETURNING *',
    [user.id, name, token]
  )
  return result[0]
}

export async function getDomains(): Promise<Domain[]> {
  const user = await stackServerApp.getUser()
  if (!user) throw new Error('Unauthorized')
  return await query<Domain[]>(
    'SELECT * FROM "Domain" WHERE user_id = $1 ORDER BY domain',
    [user.id]
  )
}

export async function verifyDomain(id: string, token: string): Promise<boolean> {
  const result = await query<{ id: string }[]>(
    'UPDATE "Domain" SET verified = true WHERE id = $1 AND "verificationToken" = $2 RETURNING id',
    [id, token]
  )
  return result.length > 0
}

export async function getDomainByName(name: string): Promise<Domain | null> {
  const result = await queryNoAuth<Domain[]>(
    'SELECT * FROM "Domain" WHERE domain = $1 AND verified = true',
    [name]
  )
  return result.length > 0 ? result[0] : null
}
