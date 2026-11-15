import Image from 'next/image'
import { BadgeCheck, CircleDollarSign, Store } from 'lucide-react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/current-user'
import { getPayloadClient } from '@/lib/payload'
import type { Media, Trip } from '@/payload-types'
import { AddListingForm, AgentProfileForm, EditListingForm } from './storefront-forms'

export default async function StorefrontPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role !== 'agent') redirect('/dashboard')
  const payload = await getPayloadClient()
  const [listings, trips, profiles] = await Promise.all([
    payload.find({
      collection: 'agent-listings',
      user,
      overrideAccess: false,
      where: { agent: { equals: user.id } },
      depth: 2,
      limit: 100,
      sort: '-updatedAt',
    }),
    payload.find({
      collection: 'trips',
      user,
      overrideAccess: false,
      where: { status: { equals: 'active' } },
      depth: 1,
      limit: 100,
      sort: 'title',
    }),
    payload.find({
      collection: 'agent-profiles',
      user,
      overrideAccess: false,
      where: { owner: { equals: user.id } },
      limit: 1,
    }),
  ])
  const profile = profiles.docs[0]

  return (
    <div>
      <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#0b8da8]">
        Agent commerce
      </p>
      <h1 className="mt-3 text-4xl font-black tracking-[-.05em]">Your storefront</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
        Curate verified agency journeys, add your point of view, and publish only the
        recommendations you are ready to share.
      </p>

      <div className="mt-8">
        <AgentProfileForm
          profile={
            profile
              ? {
                  id: String(profile.id),
                  slug: profile.slug,
                  displayName: profile.displayName,
                  tagline: profile.tagline,
                  bio: profile.bio,
                  location: profile.location ?? '',
                  specialties:
                    profile.specialties?.map((specialty) => specialty.name).join(', ') ?? '',
                  status: profile.status,
                }
              : undefined
          }
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <section className="grid gap-5 lg:grid-cols-2">
          {listings.docs.map((listing) => {
            const trip = typeof listing.trip === 'object' ? (listing.trip as Trip) : null
            const image =
              trip && typeof trip.heroImage === 'object' ? (trip.heroImage as Media) : null
            return (
              <article
                key={listing.id}
                className="overflow-hidden rounded-[26px] border border-slate-100 bg-white shadow-sm"
              >
                {image?.url && (
                  <div className="relative h-44">
                    <Image
                      src={image.url}
                      alt={image.alt}
                      fill
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      className="object-cover"
                    />
                    <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-extrabold capitalize text-slate-600">
                      {listing.status}
                    </span>
                  </div>
                )}
                <div className="p-5">
                  <p className="text-xs font-bold text-[#0b8da8]">{trip?.title ?? 'Journey'}</p>
                  <h2 className="mt-2 text-lg font-black">{listing.publicTitle}</h2>
                  <div className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-400">
                    <CircleDollarSign size={15} className="text-emerald-600" />
                    {trip?.agentCommission ?? 0}% commission
                    <BadgeCheck size={15} className="ml-2 text-[#0b8da8]" />
                    Verified supply
                  </div>
                  <EditListingForm
                    listing={{
                      id: String(listing.id),
                      publicTitle: listing.publicTitle,
                      personalNote: listing.personalNote,
                      status: listing.status,
                    }}
                  />
                </div>
              </article>
            )
          })}
          {listings.docs.length === 0 && (
            <div className="rounded-[28px] border border-dashed border-slate-200 bg-white p-12 text-center lg:col-span-2">
              <Store className="mx-auto text-slate-300" size={34} />
              <h2 className="mt-3 font-extrabold">Your storefront is ready to curate</h2>
              <p className="mt-2 text-sm text-slate-400">
                Choose a marketplace journey to create your first draft.
              </p>
            </div>
          )}
        </section>
        <aside>
          <AddListingForm
            trips={trips.docs.map((trip) => ({
              id: String(trip.id),
              title: trip.title,
              commission: trip.agentCommission,
            }))}
          />
        </aside>
      </div>
    </div>
  )
}
