import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Heart } from 'lucide-react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/current-user'
import { getPayloadClient } from '@/lib/payload'
import type { Media, Trip } from '@/payload-types'
import SaveTripButton from '../../save-trip-button'

export default async function SavedTripsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const payload = await getPayloadClient()
  const saved = await payload.find({
    collection: 'saved-trips',
    user,
    overrideAccess: false,
    where: { owner: { equals: user.id } },
    depth: 2,
    limit: 100,
    sort: '-createdAt',
  })

  return (
    <div>
      <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#0b8da8]">
        Traveler shortlist
      </p>
      <h1 className="mt-3 text-4xl font-black tracking-[-.05em]">Saved journeys</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
        Your wishlist follows your account across devices, so the journeys you love are always ready
        when you are.
      </p>
      {saved.docs.length > 0 ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {saved.docs.map((entry) => {
            const trip = typeof entry.trip === 'object' ? (entry.trip as Trip) : null
            const image =
              trip && typeof trip.heroImage === 'object' ? (trip.heroImage as Media) : null
            if (!trip) return null
            return (
              <article
                key={entry.id}
                className="overflow-hidden rounded-[26px] border border-slate-100 bg-white shadow-sm"
              >
                {image?.url && (
                  <div className="relative h-48">
                    <Image
                      src={image.url}
                      alt={image.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-5">
                  <p className="text-xs font-bold text-[#0b8da8]">{trip.destination}</p>
                  <h2 className="mt-2 text-xl font-black">{trip.title}</h2>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                    {trip.tagline}
                  </p>
                  <div className="mt-5 flex items-center gap-2">
                    <Link
                      href={`/trips/${trip.slug}`}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0b2e4a] px-4 py-3 text-xs font-extrabold text-white"
                    >
                      View journey <ArrowRight size={14} />
                    </Link>
                    <SaveTripButton tripId={String(trip.id)} label={false} />
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="mt-8 rounded-[28px] border border-dashed border-slate-200 bg-white p-14 text-center">
          <Heart className="mx-auto text-slate-300" size={36} />
          <h2 className="mt-4 text-lg font-extrabold">Your wishlist is empty</h2>
          <p className="mt-2 text-sm text-slate-400">
            Save journeys from the marketplace to compare them here.
          </p>
          <Link
            href="/#journeys"
            className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-[#0b8da8]"
          >
            Explore journeys <ArrowRight size={15} />
          </Link>
        </div>
      )}
    </div>
  )
}
