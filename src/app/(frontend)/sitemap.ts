import type { MetadataRoute } from 'next'
import { getPayloadClient } from '@/lib/payload'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL
  if (!base) return []
  const payload = await getPayloadClient()
  const [trips, agencies, agents, pages, policies] = await Promise.all([
    payload.find({
      collection: 'trips',
      where: { status: { equals: 'active' } },
      limit: 1000,
      overrideAccess: false,
    }),
    payload.find({
      collection: 'agencies',
      where: { status: { equals: 'verified' } },
      limit: 1000,
      overrideAccess: false,
    }),
    payload.find({
      collection: 'agent-profiles',
      where: { status: { equals: 'published' } },
      limit: 1000,
      overrideAccess: false,
    }),
    payload.find({
      collection: 'ai-projects',
      where: { status: { equals: 'published' } },
      limit: 1000,
      overrideAccess: false,
    }),
    payload.find({
      collection: 'legal-policies',
      where: { status: { equals: 'published' } },
      limit: 100,
      overrideAccess: false,
    }),
  ])
  const entry = (path: string, updatedAt?: string) => ({
    url: new URL(path, base).toString(),
    lastModified: updatedAt ? new Date(updatedAt) : new Date(),
  })
  return [
    entry('/'),
    ...trips.docs.map((trip) => entry(`/trips/${trip.slug}`, trip.updatedAt)),
    ...agencies.docs.map((agency) => entry(`/agencies/${agency.slug}`, agency.updatedAt)),
    ...agents.docs.map((agent) => entry(`/agents/${agent.slug}`, agent.updatedAt)),
    ...pages.docs.flatMap((page) =>
      page.slug ? [entry(`/pages/${page.slug}`, page.updatedAt)] : [],
    ),
    ...policies.docs.map((policy) => entry(`/legal/${policy.slug}`, policy.updatedAt)),
  ]
}
