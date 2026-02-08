export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get('domain')
  if (!domain) {
    return NextResponse.json({ error: 'Domain required' }, { status: 400 })
  }

  const token = process.env.VERCEL_API_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID
  if (!token || !projectId) {
    return NextResponse.json({ error: 'Missing Vercel credentials' }, { status: 500 })
  }

  const res = await fetch(`https://api.vercel.com/v6/domains/${domain}?projectId=${projectId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json()
  if (!res.ok) {
    return NextResponse.json(data, { status: res.status })
  }

  return NextResponse.json({ configured: data.configured, verified: data.verified, misconfigured: data.misconfigured })
}
