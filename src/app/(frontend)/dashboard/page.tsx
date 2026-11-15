import Link from 'next/link'
import {
  ArrowRight,
  Bot,
  Building2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  MapPinned,
  PackageCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/current-user'
import { getPayloadClient } from '@/lib/payload'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const payload = await getPayloadClient()

  const [orders, projects, listings, memberships] = await Promise.all([
    payload.find({
      collection: 'orders',
      user,
      overrideAccess: false,
      depth: 2,
      limit: 8,
      sort: '-createdAt',
    }),
    payload.find({
      collection: 'ai-projects',
      user,
      overrideAccess: false,
      limit: 6,
      sort: '-updatedAt',
    }),
    user.role === 'agent'
      ? payload.find({
          collection: 'agent-listings',
          user,
          overrideAccess: false,
          depth: 2,
          limit: 8,
        })
      : Promise.resolve({ docs: [], totalDocs: 0 }),
    user.role === 'agency'
      ? payload.find({
          collection: 'agency-memberships',
          user,
          overrideAccess: false,
          depth: 1,
          limit: 20,
        })
      : Promise.resolve({ docs: [], totalDocs: 0 }),
  ])

  const paidVolume = orders.docs
    .filter((order) => ['paid', 'confirmed', 'completed'].includes(order.status))
    .reduce((sum, order) => sum + order.total, 0)

  const roleCopy = {
    traveler: {
      kicker: 'Traveler workspace',
      title: 'Your next chapter starts here.',
      text: 'Track every request, payment and confirmed journey in one calm place.',
    },
    agent: {
      kicker: 'Agent workspace',
      title: 'Sell smarter. Earn clearly.',
      text: 'Curate verified inventory, monitor conversion and keep every commission visible.',
    },
    agency: {
      kicker: 'Agency command center',
      title: 'Operate the whole journey.',
      text: 'Manage inventory, teams, booking demand and settlement from one connected view.',
    },
  }[user.role]

  const metrics =
    user.role === 'traveler'
      ? [
          ['Active journeys', String(orders.totalDocs), MapPinned, 'text-[#0b94ab] bg-[#e9f8fa]'],
          [
            'Payments',
            `$${paidVolume.toLocaleString()}`,
            CreditCard,
            'text-[#7563cf] bg-[#f0edff]',
          ],
          ['AI plans', String(projects.totalDocs), Bot, 'text-[#ef6845] bg-[#fff0e9]'],
          ['Support', '24 / 7', Clock3, 'text-[#0d9d82] bg-[#e9faf5]'],
        ]
      : [
          [
            user.role === 'agent' ? 'Live listings' : 'Agency access',
            String(user.role === 'agent' ? listings.totalDocs : memberships.totalDocs),
            user.role === 'agent' ? PackageCheck : Building2,
            'text-[#0b94ab] bg-[#e9f8fa]',
          ],
          [
            'Paid volume',
            `$${paidVolume.toLocaleString()}`,
            CircleDollarSign,
            'text-[#0d9d82] bg-[#e9faf5]',
          ],
          ['Orders', String(orders.totalDocs), CreditCard, 'text-[#7563cf] bg-[#f0edff]'],
          ['AI projects', String(projects.totalDocs), Sparkles, 'text-[#ef6845] bg-[#fff0e9]'],
        ]

  return (
    <>
      <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.17em] text-[#0c8da8]">
            {roleCopy.kicker}
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-[-.055em] sm:text-5xl">
            {roleCopy.title}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">{roleCopy.text}</p>
        </div>
        <Link
          href="/studio"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ff6047] px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-[#ff6047]/20"
        >
          <Sparkles size={17} />
          Create with Masidy Make
        </Link>
      </div>

      <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value, Icon, color]) => {
          const MetricIcon = Icon as typeof MapPinned
          return (
            <div
              key={String(label)}
              className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm"
            >
              <div className={`grid size-11 place-items-center rounded-2xl ${color}`}>
                <MetricIcon size={21} />
              </div>
              <p className="mt-5 text-3xl font-black tracking-[-.045em]">{String(value)}</p>
              <p className="mt-1 text-xs font-bold text-slate-400">{String(label)}</p>
            </div>
          )
        })}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_.75fr]">
        <section
          id="records"
          className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm sm:p-7"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.14em] text-slate-400">
                Live operations
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-[-.04em]">
                {user.role === 'traveler' ? 'Your journeys' : 'Recent orders'}
              </h2>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-extrabold text-slate-500">
              {orders.totalDocs} total
            </span>
          </div>
          {orders.docs.length > 0 ? (
            <div className="mt-5 divide-y divide-slate-100">
              {orders.docs.map((order) => {
                const trip = typeof order.trip === 'string' ? null : order.trip
                return (
                  <div
                    key={order.id}
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center"
                  >
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#eaf7f9] text-[#0b8fa9]">
                      <MapPinned size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold">
                        {trip?.title ?? order.reference}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {order.reference} · {order.travelers} traveler
                        {order.travelers > 1 ? 's' : ''}
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-extrabold capitalize text-amber-700">
                      {order.status}
                    </span>
                    <p className="text-sm font-black">
                      {order.currency} {order.total.toLocaleString()}
                    </p>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-12 text-center">
              <MapPinned className="mx-auto text-slate-300" size={32} />
              <h3 className="mt-3 text-sm font-extrabold">Nothing to manage yet</h3>
              <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-400">
                New bookings and payments will appear here automatically.
              </p>
              <Link
                href="/#journeys"
                className="mt-4 inline-flex items-center gap-1 text-xs font-extrabold text-[#0b8da8]"
              >
                Explore inventory <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <section className="rounded-[28px] bg-[#0b2e4a] p-6 text-white shadow-lg">
            <Sparkles className="text-[#67dce2]" size={23} />
            <h2 className="mt-4 text-2xl font-black tracking-[-.04em]">Masidy Make</h2>
            <p className="mt-2 text-sm leading-6 text-white/60">
              Generate a landing page brief, campaign, itinerary or social content using your
              marketplace data.
            </p>
            <Link
              href="/studio"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-extrabold text-[#0b2e4a]"
            >
              Open the studio <ArrowRight size={14} />
            </Link>
          </section>

          <section
            id="network"
            className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-[#fff0e9] text-[#ef6744]">
                <Users size={19} />
              </span>
              <div>
                <h2 className="text-sm font-extrabold">Workspace mode</h2>
                <p className="text-xs capitalize text-slate-400">{user.role}</p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              Marketplace roles are activated after partner verification. Your guest demo remains
              available for exploring every workspace.
            </p>
            <Link
              href={user.role === 'traveler' ? '/onboarding' : '/demo'}
              className="mt-4 inline-flex items-center gap-1 text-xs font-extrabold text-[#0b8da8]"
            >
              {user.role === 'traveler' ? 'Apply as a partner' : 'Open role demo'}
              <ArrowRight size={14} />
            </Link>
          </section>
        </aside>
      </div>
    </>
  )
}
