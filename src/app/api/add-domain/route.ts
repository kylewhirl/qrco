export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { StackServerApp } from '@stackframe/stack'
import { saveDomain } from '@/lib/domain-service'
import { isApexDomain } from '@/lib/utils'

const stack = new StackServerApp({
  tokenStore: 'nextjs-cookie',
  urls: { signIn: '/login' },
})

export async function POST(request: Request) {
  const { domain } = await request.json()
  if (!domain) {
    return NextResponse.json({ error: 'Domain is required' }, { status: 400 })
  }

  const user = await stack.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = process.env.VERCEL_API_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID
  if (!token || !projectId) {
    return NextResponse.json({ error: 'Missing Vercel credentials' }, { status: 500 })
  }

  const res = await fetch(`https://api.vercel.com/v10/projects/${projectId}/domains`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name: domain }),
  })

  const data = await res.json()
  if (!res.ok) {
    return NextResponse.json(data, { status: res.status })
  }

  const status = data?.verified ? 'active' : 'pending'
  await saveDomain(user.id, domain, status)

  return NextResponse.json({ domain, type: isApexDomain(domain) ? 'apex' : 'subdomain', status })
}
