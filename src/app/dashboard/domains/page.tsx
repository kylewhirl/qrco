import { getDomains } from '@/lib/domain-service'
import { DomainsClient } from './client'

export default async function DomainsPage() {
  const domains = await getDomains()
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Domains</h2>
      <DomainsClient initialDomains={domains} />
    </div>
  )
}
