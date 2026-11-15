import Image from 'next/image'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, BadgeCheck, MapPin, Sparkles } from 'lucide-react'
import { notFound } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'
import { getPublicAgent } from '@/lib/public-records'
import type { Media, Trip } from '@/payload-types'

export const dynamic = 'force-static'

export async function generateStaticParams() {
  const payload = await getPayloadClient()
  const profiles = await payload.find({
    collection: 'agent-profiles',
    where: { status: { equals: 'published' } },
    limit: 500,
    overrideAccess: false,
  })
  return profiles.docs.map((profile) => ({ slug: profile.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const result = await getPublicAgent(slug)
  if (!result) return {}
  const avatar = typeof result.profile.avatar === 'object' ? (result.profile.avatar as Media) : null
  return {
    title: `${result.profile.displayName} | Masidy travel agent`,
    description: result.profile.tagline,
    openGraph: {
      title: result.profile.displayName,
      description: result.profile.tagline,
      images: avatar?.url ? [avatar.url] : undefined,
    },
  }
}

export default async function AgentStorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const result = await getPublicAgent(slug)
  if (!result) notFound()
  const { profile, listings } = result
  const avatar = typeof profile.avatar === 'object' ? (profile.avatar as Media) : null

  return (
    <main className="min-h-screen bg-[#f7f8f6] text-[#0b2944]">
      <section className="bg-[#0b2e4a] px-5 py-8 text-white sm:px-8 lg:py-14">
        <div className="mx-auto max-w-[1200px]">
          <Link
            href="/#journeys"
            className="inline-flex items-center gap-2 text-xs font-extrabold text-white/60"
          >
            <ArrowLeft size={15} /> Explore all journeys
          </Link>
          <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-center">
            {avatar?.url ? (
              <div className="relative size-28 overflow-hidden rounded-[30px]">
                <Image
                  src={avatar.url}
                  alt={avatar.alt}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              </div>
            ) : (
              <span className="grid size-28 place-items-center rounded-[30px] bg-[#63d6df] text-3xl font-black text-[#0b2e4a]">
                {profile.displayName.slice(0, 2).toUpperCase()}
              </span>
            )}
            <div>
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.13em] text-[#70dce4]">
                <BadgeCheck size={16} /> Verified Masidy agent
              </div>
              <h1 className="mt-3 text-4xl font-black tracking-[-.055em] sm:text-6xl">
                {profile.displayName}
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-white/60">{profile.tagline}</p>
              {profile.location && (
                <p className="mt-3 flex items-center gap-2 text-xs font-bold text-white/45">
                  <MapPin size={14} /> {profile.location}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-[1200px] px-5 py-12 sm:px-8 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[300px_1fr]">
          <aside>
            <p className="text-xs font-extrabold uppercase tracking-[.14em] text-[#0b8da8]">
              About your curator
            </p>
            <p className="mt-4 text-sm leading-7 text-slate-600">{profile.bio}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {profile.specialties?.map((specialty) => (
                <span
                  key={specialty.id}
                  className="rounded-full bg-white px-3 py-2 text-[11px] font-extrabold text-slate-500"
                >
                  {specialty.name}
                </span>
              ))}
            </div>
          </aside>
          <section>
            <p className="text-xs font-extrabold uppercase tracking-[.14em] text-[#0b8da8]">
              Curated collection
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-.045em]">Journeys I recommend</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {listings.map((listing) => {
                const trip = typeof listing.trip === 'object' ? (listing.trip as Trip) : null
                const image =
                  trip && typeof trip.heroImage === 'object' ? (trip.heroImage as Media) : null
                if (!trip || !image?.url) return null
                return (
                  <article
                    key={listing.id}
                    className="overflow-hidden rounded-[26px] bg-white shadow-sm"
                  >
                    <div className="relative h-52">
                      <Image
                        src={image.url}
                        alt={image.alt}
                        fill
                        sizes="(max-width: 768px) 100vw, 40vw"
                        className="object-cover"
                      />
                    </div>
                    <div className="p-5">
                      <p className="flex items-center gap-2 text-xs font-bold text-[#0b8da8]">
                        <Sparkles size={14} /> {listing.publicTitle}
                      </p>
                      <h3 className="mt-2 text-xl font-black">{trip.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-slate-500">
                        {listing.personalNote}
                      </p>
                      <Link
                        href={`/trips/${trip.slug}?agent=${profile.slug}`}
                        className="mt-5 inline-flex items-center gap-2 text-xs font-extrabold text-[#0b8da8]"
                      >
                        View attributed journey <ArrowRight size={14} />
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>
            {listings.length === 0 && (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-400">
                This agent is preparing their first curated collection.
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
