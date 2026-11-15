import Image from 'next/image'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Check,
  Clock3,
  MapPin,
  Star,
  Users,
  X,
} from 'lucide-react'
import { getMarketplaceData } from '@/lib/marketplace-data'
import { getPublicTrip } from '@/lib/public-records'
import type { Agency, Media, User } from '@/payload-types'
import TripActions from './trip-actions'
import SaveTripButton from '../../save-trip-button'

export const dynamic = 'force-static'

export async function generateStaticParams() {
  const { trips } = await getMarketplaceData()
  return trips.map((trip) => ({ slug: trip.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const result = await getPublicTrip(slug)
  if (!result) return {}
  const hero = typeof result.trip.heroImage === 'object' ? (result.trip.heroImage as Media) : null
  return {
    title: `${result.trip.title} | Masidy`,
    description: result.trip.summary || result.trip.tagline,
    openGraph: {
      title: result.trip.title,
      description: result.trip.summary || result.trip.tagline,
      images: hero?.url ? [hero.url] : undefined,
    },
  }
}

export default async function TripPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const result = await getPublicTrip(slug)
  if (!result) notFound()
  const { trip, departures, reviews } = result
  const hero = typeof trip.heroImage === 'object' ? (trip.heroImage as Media) : null
  const agency = typeof trip.agency === 'object' ? (trip.agency as Agency) : null
  if (!hero?.url || !agency) notFound()
  const structuredData = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: trip.title,
    description: trip.summary || trip.tagline,
    touristType: trip.category,
    provider: { '@type': 'TravelAgency', name: agency.name },
    offers: {
      '@type': 'Offer',
      price: trip.price,
      priceCurrency: trip.currency,
      availability: 'https://schema.org/InStock',
    },
  }).replaceAll('<', '\\u003c')

  return (
    <main className="min-h-screen bg-[#f7f8f6] text-[#0b2944]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />
      <div className="relative h-[58vh] min-h-[520px] overflow-hidden">
        <Image src={hero.url} alt={hero.alt} fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071d30]/90 via-[#071d30]/15 to-[#071d30]/25" />
        <div className="absolute inset-x-0 top-0 z-10 p-5 sm:p-8">
          <Link
            href="/#journeys"
            className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2.5 text-xs font-extrabold text-[#0b2944] backdrop-blur"
          >
            <ArrowLeft size={15} />
            Back to journeys
          </Link>
        </div>
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1320px] px-5 pb-10 text-white sm:px-8 lg:pb-14">
          <div className="flex flex-wrap items-center gap-3 text-xs font-extrabold uppercase tracking-[.13em] text-white/65">
            <span className="flex items-center gap-1.5">
              <MapPin size={14} />
              {trip.destination}, {trip.country}
            </span>
            <span>•</span>
            <span>{trip.durationDays} days</span>
            <span>•</span>
            <span className="capitalize">{trip.category}</span>
          </div>
          <h1 className="mt-4 max-w-4xl text-4xl font-black leading-[.95] tracking-[-.06em] sm:text-6xl lg:text-7xl">
            {trip.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
            {trip.summary || trip.tagline}
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1320px] gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_360px] lg:py-16">
        <div className="min-w-0 space-y-12">
          <section className="flex flex-col justify-between gap-5 rounded-[28px] bg-white p-6 shadow-sm sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <span className="grid size-12 place-items-center rounded-2xl bg-[#eaf8fa] text-[#0b91a9]">
                <BadgeCheck size={23} />
              </span>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[.12em] text-slate-400">
                  Fulfilled by
                </p>
                <Link href={`/agencies/${agency.slug}`} className="mt-1 block text-lg font-black">
                  {agency.name}
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-5 text-sm">
              <span className="flex items-center gap-1 font-extrabold">
                <Star size={16} className="fill-[#f4ba45] text-[#f4ba45]" />
                {trip.rating}
              </span>
              <span className="text-slate-400">{trip.reviewCount} reviews</span>
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-700">
                Verified agency
              </span>
            </div>
          </section>

          {trip.highlights && trip.highlights.length > 0 && (
            <section>
              <p className="text-xs font-extrabold uppercase tracking-[.15em] text-[#0b8ca8]">
                Why this journey
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-[-.045em]">Trip highlights</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {trip.highlights.map((highlight) => (
                  <article
                    key={highlight.id}
                    className="rounded-2xl border border-slate-100 bg-white p-5"
                  >
                    <Check className="text-emerald-600" size={18} />
                    <h3 className="mt-3 font-extrabold">{highlight.title}</h3>
                    {highlight.description && (
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {highlight.description}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}

          <section>
            <p className="text-xs font-extrabold uppercase tracking-[.15em] text-[#0b8ca8]">
              Day by day
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-.045em]">Your itinerary</h2>
            <div className="mt-6 space-y-3">
              {(trip.itinerary?.length
                ? trip.itinerary
                : [
                    {
                      id: 'overview',
                      day: 1,
                      title: 'A journey designed around you',
                      description:
                        'The fulfilling agency will confirm the detailed day-by-day program, preferred room category, transfers and special requests before payment is finalized.',
                    },
                  ]
              ).map((day) => (
                <article
                  key={day.id}
                  className="grid gap-4 rounded-2xl bg-white p-5 sm:grid-cols-[72px_1fr]"
                >
                  <span className="grid size-14 place-items-center rounded-2xl bg-[#0b2e4a] text-xs font-extrabold text-white">
                    Day {day.day}
                  </span>
                  <div>
                    <h3 className="font-extrabold">{day.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{day.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-5 md:grid-cols-2">
            <div className="rounded-[24px] bg-[#eaf9f5] p-6">
              <h2 className="text-xl font-black">Included</h2>
              <div className="mt-4 space-y-3">
                {(trip.inclusions?.length
                  ? trip.inclusions.map((entry) => entry.item)
                  : ['Verified agency fulfillment', 'Pre-trip support', 'Secure booking protection']
                ).map((item) => (
                  <p key={item} className="flex items-start gap-2 text-sm text-slate-600">
                    <Check size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                    {item}
                  </p>
                ))}
              </div>
            </div>
            <div className="rounded-[24px] bg-[#fff1ec] p-6">
              <h2 className="text-xl font-black">Not included</h2>
              <div className="mt-4 space-y-3">
                {(trip.exclusions?.length
                  ? trip.exclusions.map((entry) => entry.item)
                  : ['International flights unless stated', 'Personal expenses', 'Travel insurance']
                ).map((item) => (
                  <p key={item} className="flex items-start gap-2 text-sm text-slate-600">
                    <X size={16} className="mt-0.5 shrink-0 text-[#ef6848]" />
                    {item}
                  </p>
                ))}
              </div>
            </div>
          </section>

          {departures.length > 0 && (
            <section>
              <p className="text-xs font-extrabold uppercase tracking-[.15em] text-[#0b8ca8]">
                Live availability
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-[-.045em]">Upcoming departures</h2>
              <div className="mt-6 space-y-3">
                {departures.map((departure) => {
                  const remaining = Math.max(0, departure.capacity - departure.booked)
                  return (
                    <div
                      key={departure.id}
                      className="flex flex-col gap-4 rounded-2xl bg-white p-5 sm:flex-row sm:items-center"
                    >
                      <span className="grid size-11 place-items-center rounded-xl bg-[#eaf8fa] text-[#0b8da7]">
                        <CalendarDays size={19} />
                      </span>
                      <div className="flex-1">
                        <p className="font-extrabold">{departure.label}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {new Date(departure.startDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <Users size={15} />
                        {remaining} spots left
                      </span>
                      <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-extrabold capitalize text-emerald-700">
                        {departure.status}
                      </span>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          <section>
            <p className="text-xs font-extrabold uppercase tracking-[.15em] text-[#0b8ca8]">
              Traveler feedback
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-.045em]">Verified reviews</h2>
            {reviews.length > 0 ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {reviews.map((review) => {
                  const author = typeof review.author === 'object' ? (review.author as User) : null
                  return (
                    <article key={review.id} className="rounded-2xl bg-white p-5">
                      <div className="flex gap-1">
                        {Array.from({ length: review.rating }, (_, index) => (
                          <Star key={index} size={14} className="fill-[#f4ba45] text-[#f4ba45]" />
                        ))}
                      </div>
                      <h3 className="mt-3 font-extrabold">{review.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{review.body}</p>
                      <p className="mt-4 text-xs font-bold text-slate-400">
                        {author?.name ?? 'Verified traveler'}
                      </p>
                    </article>
                  )
                })}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-white/50 p-8 text-center text-sm text-slate-400">
                New verified reviews will appear here after completed journeys.
              </div>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <TripActions
            tripId={trip.id}
            price={trip.price}
            currency={trip.currency}
            departures={departures.map((departure) => ({
              id: String(departure.id),
              label: departure.label,
              startDate: departure.startDate,
              remaining: Math.max(0, departure.capacity - departure.booked),
            }))}
          />
          <div className="mt-3">
            <SaveTripButton tripId={String(trip.id)} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              [Clock3, `${trip.durationDays} days`],
              [Users, 'Private / group'],
              [MapPin, trip.difficulty || 'Flexible'],
            ].map(([Icon, label]) => {
              const DetailIcon = Icon as typeof Clock3
              return (
                <div key={String(label)} className="rounded-xl bg-white p-3 text-center">
                  <DetailIcon size={16} className="mx-auto text-[#0b8da7]" />
                  <p className="mt-2 text-[10px] font-extrabold capitalize text-slate-500">
                    {String(label)}
                  </p>
                </div>
              )
            })}
          </div>
        </aside>
      </div>
    </main>
  )
}
