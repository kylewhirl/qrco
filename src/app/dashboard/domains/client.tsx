"use client"
import { useState } from 'react'
import type { Domain } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function DomainsClient({ initialDomains }: { initialDomains: Domain[] }) {
  const [domains, setDomains] = useState<Domain[]>(initialDomains)
  const [newDomain, setNewDomain] = useState('')

  const create = async () => {
    if (!newDomain) return
    const res = await fetch('/api/domain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: newDomain })
    })
    if (res.ok) {
      const d = await res.json()
      setDomains([...domains, d])
      setNewDomain('')
    }
  }

  const verify = async (id: string, token: string) => {
    const res = await fetch('/api/domain/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, token })
    })
    if (res.ok) {
      setDomains(domains.map(d => d.id === id ? { ...d, verified: true } : d))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input value={newDomain} onChange={e => setNewDomain(e.target.value)} placeholder="example.com" />
        <Button onClick={create}>Add Domain</Button>
      </div>
      <ul className="space-y-2">
        {domains.map(d => (
          <li key={d.id} className="border rounded p-2 flex justify-between items-center">
            <div>
              <div>{d.domain}</div>
              {!d.verified && <div className="text-sm text-muted-foreground">Token: {d.verificationToken}</div>}
            </div>
            {d.verified ? (
              <span className="text-green-600 text-sm">Verified</span>
            ) : (
              <Button size="sm" onClick={() => verify(d.id, d.verificationToken)}>Verify</Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
