"use client"
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { isApexDomain } from '@/lib/utils'

interface DomainEntry {
  id: string
  user_id: string
  name: string
  status: string
}

interface Props {
  initialDomains: DomainEntry[]
}

export function DomainClient({ initialDomains }: Props) {
  const [domains, setDomains] = useState<DomainEntry[]>(initialDomains)
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)

  const addDomain = async () => {
    if (!value) return
    setLoading(true)
    const res = await fetch('/api/add-domain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: value })
    })
    const data = await res.json()
    if (res.ok) {
      setDomains([{ id: value, user_id: '', name: value, status: data.status }, ...domains])
      toast.success('Domain added')
      setValue('')
    } else {
      toast.error(data.error || 'Failed to add domain')
    }
    setLoading(false)
  }

  const fetchStatus = async (domain: string) => {
    const res = await fetch(`/api/domain-status?domain=${domain}`)
    if (!res.ok) return null
    return await res.json()
  }

  useEffect(() => {
    const interval = setInterval(() => {
      domains.forEach(async d => {
        const s = await fetchStatus(d.name)
        if (s && s.verified && d.status !== 'active') {
          setDomains(cur => cur.map(x => x.name === d.name ? { ...x, status: 'active' } : x))
        }
      })
    }, 10000)
    return () => clearInterval(interval)
  }, [domains])

  return (
    <div className="space-y-4">
      <div className="flex gap-2 max-w-md">
        <Input value={value} onChange={e => setValue(e.target.value)} placeholder="example.com" />
        <Button onClick={addDomain} disabled={loading}>{loading ? 'Adding...' : 'Add'}</Button>
      </div>
      <ul className="space-y-2">
        {domains.map(d => (
          <li key={d.name} className="border rounded p-2">
            <div className="font-medium">{d.name}</div>
            <DomainInstructions domain={d.name} />
            <div className="text-sm text-muted-foreground">Status: {d.status}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function DomainInstructions({ domain }: { domain: string }) {
  const apex = isApexDomain(domain)
  return apex ? (
    <p className="text-sm">Create two A records for <b>{domain}</b>: 76.76.21.21</p>
  ) : (
    <p className="text-sm">Create a CNAME record pointing <b>{domain}</b> → tqrco.de</p>
  )
}
