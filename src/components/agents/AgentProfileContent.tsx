'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/services/api'

type Agent = {
  name: string
  slug: string
  email?: string | null
  phone?: string | null
  profileImage?: string | null
  bio?: string | null
  specialization?: string | null
  yearsExperience?: number | null
  properties?: { id: string; slug: string; title: string; location?: string; price?: string | number }[]
}

type AgentProfileContentProps = {
  agentSlug: string
}

export default function AgentProfileContent({ agentSlug }: AgentProfileContentProps) {
  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!agentSlug) {
      setError('Agent profile not found.')
      setLoading(false)
      return
    }

    api.getAgent(agentSlug)
      .then((response) => setAgent((response as { data: Agent }).data))
      .catch((requestError: unknown) => {
        setError(requestError instanceof Error ? requestError.message : 'Unable to load this agent.')
      })
      .finally(() => setLoading(false))
  }, [agentSlug])

  if (loading) return <main className="mx-auto max-w-5xl px-4 py-16 text-slate-600">Loading agent profile…</main>
  if (error || !agent) return <main role="alert" className="mx-auto max-w-5xl px-4 py-16 text-red-700">{error || 'Agent profile not found.'}</main>

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Link href="/our-team" className="text-emerald-700 hover:underline">← Back to our team</Link>
        <section className="mt-6 grid gap-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-[16rem_1fr]">
          {agent.profileImage ? (
            <img src={agent.profileImage} alt={agent.name} className="h-64 w-full rounded-lg object-cover" />
          ) : (
            <div className="flex h-64 items-center justify-center rounded-lg bg-slate-200 text-6xl font-semibold text-slate-500" aria-hidden="true">
              {agent.name.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{agent.name}</h1>
            {agent.specialization && <p className="mt-2 font-medium text-emerald-700">{agent.specialization}</p>}
            {agent.yearsExperience != null && <p className="mt-3 text-slate-600">{agent.yearsExperience} years of experience</p>}
            {agent.bio && <p className="mt-5 whitespace-pre-wrap leading-relaxed text-slate-700">{agent.bio}</p>}
            <div className="mt-5 flex flex-wrap gap-4">
              {agent.phone && <a className="text-emerald-700 hover:underline" href={`tel:${agent.phone}`}>{agent.phone}</a>}
              {agent.email && <a className="text-emerald-700 hover:underline" href={`mailto:${agent.email}`}>{agent.email}</a>}
            </div>
          </div>
        </section>
        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-slate-900">Properties listed by {agent.name}</h2>
          {agent.properties?.length ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {agent.properties.map((property) => (
                <Link key={property.id} href={`/properties/${encodeURIComponent(property.id)}`} className="rounded-lg border border-slate-200 bg-white p-5 hover:border-emerald-500">
                  <h3 className="font-semibold text-slate-900">{property.title}</h3>
                  {property.location && <p className="mt-2 text-sm text-slate-600">{property.location}</p>}
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-slate-600">There are no available listings for this agent.</p>
          )}
        </section>
      </div>
    </main>
  )
}
