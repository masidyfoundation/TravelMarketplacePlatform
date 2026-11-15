import Link from 'next/link'
import { CalendarDays, MapPinned, PackageOpen } from 'lucide-react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/current-user'
import { getPayloadClient } from '@/lib/payload'
import { DepartureForm, NewDepartureForm, TripStatusForm } from './inventory-forms'

export default async function InventoryPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role !== 'agency') redirect('/dashboard')
  const payload = await getPayloadClient()
  const [trips, departures] = await Promise.all([
    payload.find({
      collection: 'trips',
      user,
      overrideAccess: false,
      depth: 1,
      limit: 100,
      sort: 'title',
    }),
    payload.find({
      collection: 'departures',
      user,
      overrideAccess: false,
      depth: 1,
      limit: 200,
      sort: 'startDate',
    }),
  ])
  const managedTripIDs = new Set(trips.docs.map((trip) => String(trip.id)))
  const managedDepartures = departures.docs.filter((departure) => {
    const tripID = typeof departure.trip === 'string' ? departure.trip : String(departure.trip.id)
    return managedTripIDs.has(tripID)
  })

  return (
    <div>
      <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#0b8da8]">
        Agency operations
      </p>
      <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-4xl font-black tracking-[-.05em]">Inventory</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Control journey visibility, dated capacity, and live availability for the agencies you
            manage.
          </p>
        </div>
        <Link href="/onboarding" className="text-xs font-extrabold text-[#0b8da8]">
          Partner verification
        </Link>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_340px]">
        <section className="space-y-5">
          {trips.docs.length > 0 ? (
            trips.docs.map((trip) => {
              const tripDepartures = managedDepartures.filter((departure) => {
                const id =
                  typeof departure.trip === 'string' ? departure.trip : String(departure.trip.id)
                return id === String(trip.id)
              })
              return (
                <article
                  key={trip.id}
                  className="rounded-[26px] border border-slate-100 bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                      <span className="grid size-11 place-items-center rounded-xl bg-[#eaf8fa] text-[#0b8da8]">
                        <MapPinned size={20} />
                      </span>
                      <div>
                        <h2 className="font-extrabold">{trip.title}</h2>
                        <p className="mt-1 text-xs text-slate-400">
                          {trip.destination} · {tripDepartures.length} departures
                        </p>
                      </div>
                    </div>
                    <TripStatusForm trip={{ id: String(trip.id), status: trip.status }} />
                  </div>
                  <div className="mt-5 space-y-3">
                    {tripDepartures.map((departure) => (
                      <div key={departure.id} className="rounded-2xl bg-slate-50 p-4">
                        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                          <div>
                            <p className="text-sm font-extrabold">{departure.label}</p>
                            <p className="mt-1 text-xs text-slate-400">
                              {new Date(departure.startDate).toLocaleDateString()} –{' '}
                              {new Date(departure.endDate).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="text-xs font-bold text-slate-500">
                            {departure.capacity - departure.booked} places available
                          </span>
                        </div>
                        <DepartureForm
                          departure={{
                            id: String(departure.id),
                            status: departure.status,
                            capacity: departure.capacity,
                            booked: departure.booked,
                          }}
                        />
                      </div>
                    ))}
                    {tripDepartures.length === 0 && (
                      <p className="rounded-2xl border border-dashed border-slate-200 p-5 text-center text-xs text-slate-400">
                        No dated departures yet.
                      </p>
                    )}
                  </div>
                </article>
              )
            })
          ) : (
            <div className="rounded-[28px] border border-dashed border-slate-200 bg-white p-12 text-center">
              <PackageOpen className="mx-auto text-slate-300" size={34} />
              <h2 className="mt-3 font-extrabold">No managed inventory</h2>
              <p className="mt-2 text-sm text-slate-400">
                An administrator must connect your verified account to an agency.
              </p>
            </div>
          )}
        </section>
        <aside>
          <NewDepartureForm
            trips={trips.docs.map((trip) => ({
              id: String(trip.id),
              title: trip.title,
            }))}
          />
          <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-5">
            <CalendarDays className="text-[#0b8da8]" size={20} />
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Public trip pages show open and guaranteed departures. Closed and cancelled dates
              remain visible only in this workspace.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
