import 'server-only'

import { unstable_cache } from 'next/cache'
import { findBySlug, getPayloadClient } from '@/lib/payload'

export function getPublicTrip(slug: string) {
  return unstable_cache(
    async () => {
      const trip = await findBySlug('trips', slug, { depth: 2 })
      if (!trip) return null
      const payload = await getPayloadClient()
      const [departures, reviews] = await Promise.all([
        payload.find({
          collection: 'departures',
          where: {
            and: [{ trip: { equals: trip.id } }, { status: { in: ['open', 'guaranteed'] } }],
          },
          sort: 'startDate',
          limit: 20,
          overrideAccess: false,
        }),
        payload.find({
          collection: 'reviews',
          where: {
            and: [{ trip: { equals: trip.id } }, { status: { equals: 'approved' } }],
          },
          depth: 1,
          sort: '-createdAt',
          limit: 20,
          overrideAccess: false,
        }),
      ])
      return {
        trip,
        departures: departures.docs,
        reviews: reviews.docs,
      }
    },
    [`public-trip-${slug}`],
    {
      tags: ['marketplace', `trip:${slug}`],
      revalidate: 60,
    },
  )()
}

export function getPublicAgency(slug: string) {
  return unstable_cache(
    async () => {
      const agency = await findBySlug('agencies', slug, { depth: 2 })
      if (!agency) return null
      const payload = await getPayloadClient()
      const trips = await payload.find({
        collection: 'trips',
        where: {
          and: [{ agency: { equals: agency.id } }, { status: { equals: 'active' } }],
        },
        depth: 2,
        sort: '-featured',
        limit: 30,
        overrideAccess: false,
      })
      return { agency, trips: trips.docs }
    },
    [`public-agency-${slug}`],
    {
      tags: ['marketplace', `agency:${slug}`],
      revalidate: 60,
    },
  )()
}

export function getPublicAgent(slug: string) {
  return unstable_cache(
    async () => {
      const profile = await findBySlug('agent-profiles', slug, { depth: 2 })
      if (!profile || profile.status !== 'published') return null
      const payload = await getPayloadClient()
      const ownerID = typeof profile.owner === 'string' ? profile.owner : String(profile.owner.id)
      const listings = await payload.find({
        collection: 'agent-listings',
        where: {
          and: [{ agent: { equals: ownerID } }, { status: { equals: 'active' } }],
        },
        depth: 2,
        limit: 100,
        sort: '-updatedAt',
        overrideAccess: false,
      })
      return { profile, listings: listings.docs }
    },
    [`public-agent-${slug}`],
    {
      tags: ['agent-storefronts', `agent:${slug}`],
      revalidate: 60,
    },
  )()
}

export function getPublishedPage(slug: string) {
  return unstable_cache(
    async () => {
      const page = await findBySlug('ai-projects', slug, { depth: 2 })
      return page?.status === 'published' ? page : null
    },
    [`published-page-${slug}`],
    {
      tags: ['published-pages', `page:${slug}`],
      revalidate: 60,
    },
  )()
}
