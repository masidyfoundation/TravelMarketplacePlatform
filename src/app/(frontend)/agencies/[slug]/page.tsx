import Image from 'next/image'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, BadgeCheck, Globe2, MapPin, Star } from 'lucide-react'
import { getMarketplaceData } from '@/lib/marketplace-data'
import { getPublicAgency } from '@/lib/public-records'
import type { Media } from '@/payload-types'

export const dynamic = 'force-static'

export async function generateStaticParams() {
  const { agencies } = await getMarketplaceData()
  return agencies.map((agency) => ({ slug: agency.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const result = await getPublicAgency(slug)
  if (!result) return {}
  const cover =
    typeof result.agency.coverImage === 'object' ? (result.agency.coverImage as Media) : null
  return {
    title: `${result.agency.name} | Masidy`,
    description: result.agency.description,
    openGraph: {
      title: result.agency.name,
      description: result.agency.description,
      images: cover?.url ? [cover.url] : undefined,
    },
  }
}

export default async function AgencyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const result = await getPublicAgency(slug)
  if (!result) notFound()
  const { agency, trips } = result
  const cover = typeof agency.coverImage === 'object' ? (agency.coverImage as Media) : null
  if (!cover?.url) notFound()
  const structuredData = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    name: agency.name,
    description: agency.description,
    url: agency.website,
    address: agency.location,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: agency.rating,
      reviewCount: agency.reviewCount,
    },
  }).replaceAll('<', '\\u003c')

  return (
    <main className="min-h-screen bg-[#f6f8f7] text-[#0b2944]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />
      <section className="relative h-[460px] overflow-hidden">
        <Image
          src={cover.url}
          alt={cover.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071e31]/90 via-[#071e31]/20 to-[#071e31]/25" />
        <div className="absolute inset-x-0 top-0 p-5 sm:p-8">
          <Link
            href="/#agencies"
            className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2.5 text-xs font-extrabold backdrop-blur"
          >
            <ArrowLeft size={15} />
            All agencies
          </Link>
        </div>
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1260px] px-5 pb-10 text-white sm:px-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-xs font-extrabold backdrop-blur">
            <BadgeCheck size={15} className="text-[#6ee0e7]" />
            Masidy verified
          </span>
          <h1 className="mt-4 text-5xl font-black tracking-[-.055em] sm:text-6xl">{agency.name}</h1>
          <p className="mt-3 flex items-center gap-2 text-sm text-white/65">
            <MapPin size={15} />
            {agency.location}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1260px] px-5 py-12 sm:px-8 lg:py-16">
        <section className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.15em] text-[#0b8ca8]">
              {agency.specialty}
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-.045em]">About this agency</h2>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
              {agency.description}
            </p>
            {agency.languages && agency.languages.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {agency.languages.map((entry) => (
                  <span
                    key={entry.id}
                    className="rounded-full bg-white px-3 py-2 text-xs font-extrabold text-slate-500"
                  >
                    {entry.language}
                  </span>
                ))}
              </div>
            )}
          </div>
          <aside className="rounded-[26px] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-500">Traveler rating</span>
              <span className="flex items-center gap-1 text-lg font-black">
                <Star size={17} className="fill-[#f4ba45] text-[#f4ba45]" />
                {agency.rating}
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-sm font-bold text-slate-500">Verified reviews</span>
              <span className="font-black">{agency.reviewCount}</span>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-sm font-bold text-slate-500">Years active</span>
              <span className="font-black">{agency.yearsActive}</span>
            </div>
            {agency.website && (
              <a
                href={agency.website}
                rel="noreferrer"
                target="_blank"
                className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-[#0b2e4a] px-4 py-3 text-xs font-extrabold text-white"
              >
                <Globe2 size={15} />
                Agency website
              </a>
            )}
          </aside>
        </section>

        <section className="mt-14">
          <p className="text-xs font-extrabold uppercase tracking-[.15em] text-[#0b8ca8]">
            Published inventory
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-[-.045em]">Journeys by {agency.name}</h2>
          {trips.length > 0 ? (
            <div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {trips.map((trip) => {
                const image = typeof trip.heroImage === 'object' ? (trip.heroImage as Media) : null
                if (!image?.url) return null
                return (
                  <article
                    key={trip.id}
                    className="overflow-hidden rounded-[24px] bg-white shadow-sm"
                  >
                    <div className="relative h-56">
                      <Image
                        src={image.url}
                        alt={image.alt}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                    <div className="p-5">
                      <p className="text-xs font-extrabold uppercase tracking-[.12em] text-[#0b8ca8]">
                        {trip.destination}
                      </p>
                      <h3 className="mt-2 text-xl font-black tracking-[-.035em]">{trip.title}</h3>
                      <div className="mt-5 flex items-center justify-between">
                        <span className="text-sm font-black">
                          {trip.currency} {trip.price.toLocaleString()}
                        </span>
                        <Link
                          href={`/trips/${trip.slug}`}
                          className="inline-flex items-center gap-1 text-xs font-extrabold text-[#0b8ca8]"
                        >
                          View trip <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="mt-7 rounded-2xl border border-dashed border-slate-200 bg-white/60 p-10 text-center text-sm text-slate-400">
              This agency is preparing its next collection.
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
