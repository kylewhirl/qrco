import { type NextRequest, NextResponse } from 'next/server'
import { StackServerApp } from '@stackframe/stack'
import { createDomain, getDomains } from '@/lib/domain-service'

const stackServerApp = new StackServerApp({
  tokenStore: 'nextjs-cookie',
  urls: { signIn: '/login' },
})

export async function POST(request: NextRequest) {
  const user = await stackServerApp.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { domain } = await request.json()
    if (!domain) return NextResponse.json({ error: 'Domain required' }, { status: 400 })
    const created = await createDomain(domain)
    return NextResponse.json(created)
  } catch (err) {
    console.error('create domain error:', err)
    return NextResponse.json({ error: 'Failed to create domain' }, { status: 500 })
  }
}

export async function GET() {
  const user = await stackServerApp.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const domains = await getDomains()
    return NextResponse.json(domains)
  } catch (err) {
    console.error('list domains error:', err)
    return NextResponse.json({ error: 'Failed to fetch domains' }, { status: 500 })
  }
}
