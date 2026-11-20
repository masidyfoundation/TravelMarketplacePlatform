import 'server-only'

import { unstable_cache } from 'next/cache'
import type { Agency, Media, Trip } from '@/payload-types'
import { getPayloadClient } from '@/lib/payload'

export type PublicTrip = {
  id: string
  slug: string
  title: string
  destination: string
  country: string
  category: string
  agencyName: string
  image: string
  imageAlt: string
  imageWidth: number
  imageHeight: number
  days: number
  price: number
  currency: string
  rating: number
  reviews: number
  commission: number
  tagline: string
  featured: boolean
}

export type PublicAgency = {
  id: string
  slug: string
  name: string
  location: string
  specialty: string
  description: string
  rating: number
  reviews: number
  years: number
  image: string
  imageAlt: string
}

const mediaValue = (value: string | Media | null | undefined) =>
  typeof value === 'object' && value?.url
    ? {
        src: value.url,
        alt: value.alt,
        width: value.width ?? 1600,
        height: value.height ?? 1000,
      }
    : null

const agencyValue = (value: string | Agency) => (typeof value === 'object' ? value : null)

async function loadMarketplaceData(options?: { demo?: boolean }): Promise<{
  trips: PublicTrip[]
  agencies: PublicAgency[]
}> {
  const payload = await getPayloadClient()
  const demo = options?.demo === true
  const [tripResult, agencyResult] = await Promise.all([
    payload.find({
      collection: 'trips',
      depth: 2,
      limit: 24,
      sort: '-featured',
      where: demo ? { isDemo: { equals: true } } : { status: { equals: 'active' } },
      overrideAccess: demo,
    }),
    payload.find({
      collection: 'agencies',
      depth: 2,
      limit: 24,
      sort: '-rating',
      where: demo ? { isDemo: { equals: true } } : { status: { equals: 'verified' } },
      overrideAccess: demo,
    }),
  ])

  const trips = tripResult.docs.flatMap((trip: Trip): PublicTrip[] => {
    const image = mediaValue(trip.heroImage)
    const agency = agencyValue(trip.agency)
    if (!image || !agency) return []
    return [
      {
        id: trip.id,
        slug: trip.slug,
        title: trip.title,
        destination: trip.destination,
        country: trip.country,
        category: trip.category,
        agencyName: agency.name,
        image: image.src,
        imageAlt: image.alt,
        imageWidth: image.width,
        imageHeight: image.height,
        days: trip.durationDays,
        price: trip.price,
        currency: trip.currency,
        rating: trip.rating,
        reviews: trip.reviewCount,
        commission: trip.agentCommission,
        tagline: trip.tagline,
        featured: Boolean(trip.featured),
      },
    ]
  })

  const agencies = agencyResult.docs.flatMap((agency: Agency): PublicAgency[] => {
    const image = mediaValue(agency.coverImage)
    if (!image) return []
    return [
      {
        id: agency.id,
        slug: agency.slug,
        name: agency.name,
        location: agency.location,
        specialty: agency.specialty,
        description: agency.description,
        rating: agency.rating,
        reviews: agency.reviewCount,
        years: agency.yearsActive,
        image: image.src,
        imageAlt: image.alt,
      },
    ]
  })

  return { trips, agencies }
}

export const getMarketplaceData = unstable_cache(
  () => loadMarketplaceData(),
  ['marketplace-data'],
  {
    tags: ['marketplace'],
    // Hooks invalidate immediately in Admin/app requests; this is a resilient
    // fallback for out-of-band imports that run without a Next request context.
    revalidate: 60,
  },
)

export const getDemoMarketplaceData = unstable_cache(
  () => loadMarketplaceData({ demo: true }),
  ['demo-marketplace-data-v2'],
  {
    tags: ['marketplace'],
    revalidate: 60,
  },
)
