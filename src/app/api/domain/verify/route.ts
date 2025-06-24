import { type NextRequest, NextResponse } from 'next/server'
import { StackServerApp } from '@stackframe/stack'
import { verifyDomain } from '@/lib/domain-service'

const stackServerApp = new StackServerApp({
  tokenStore: 'nextjs-cookie',
  urls: { signIn: '/login' },
})

export async function POST(request: NextRequest) {
  const user = await stackServerApp.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id, token } = await request.json()
    if (!id || !token) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    const ok = await verifyDomain(id, token)
    if (ok) return NextResponse.json({ success: true })
    return NextResponse.json({ error: 'Verification failed' }, { status: 400 })
  } catch (err) {
    console.error('verify domain error:', err)
    return NextResponse.json({ error: 'Failed to verify domain' }, { status: 500 })
  }
}
