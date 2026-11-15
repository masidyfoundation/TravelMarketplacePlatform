import { Bell, FileCheck2, MessageCircle, PlaneTakeoff, ScrollText } from 'lucide-react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/current-user'
import { getPayloadClient } from '@/lib/payload'
import {
  BookingOperationsForm,
  ProposalForm,
  ProposalStatusForm,
  TravelerFileForm,
  TravelerProfileForm,
} from './operation-forms'

const dateInput = (value?: string | null) =>
  value ? new Date(value).toISOString().slice(0, 10) : ''

export default async function OperationsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const payload = await getPayloadClient()
  const [
    orders,
    departures,
    proposals,
    changes,
    waitlists,
    profiles,
    files,
    conversations,
    messages,
    notifications,
    trips,
  ] = await Promise.all([
    payload.find({
      collection: 'orders',
      user,
      overrideAccess: false,
      limit: 100,
      sort: '-createdAt',
    }),
    payload.find({
      collection: 'departures',
      user,
      overrideAccess: false,
      limit: 100,
      sort: 'startDate',
    }),
    payload.find({
      collection: 'proposals',
      user,
      overrideAccess: false,
      limit: 100,
      sort: '-updatedAt',
    }),
    payload.find({
      collection: 'order-changes',
      user,
      overrideAccess: false,
      limit: 100,
      sort: '-createdAt',
    }),
    payload.find({
      collection: 'waitlists',
      user,
      overrideAccess: false,
      limit: 100,
      sort: '-createdAt',
    }),
    payload.find({ collection: 'traveler-profiles', user, overrideAccess: false, limit: 1 }),
    payload.find({
      collection: 'traveler-files',
      user,
      overrideAccess: false,
      limit: 100,
      sort: '-createdAt',
    }),
    payload.find({
      collection: 'conversations',
      user,
      overrideAccess: false,
      limit: 100,
      sort: '-updatedAt',
    }),
    payload.find({
      collection: 'messages',
      user,
      overrideAccess: false,
      depth: 1,
      limit: 30,
      sort: '-createdAt',
    }),
    payload.find({
      collection: 'notifications',
      user,
      overrideAccess: false,
      limit: 50,
      sort: '-createdAt',
    }),
    payload.find({
      collection: 'trips',
      user,
      overrideAccess: false,
      where: { status: { equals: 'active' } },
      limit: 100,
      sort: 'title',
    }),
  ])
  const profile = profiles.docs[0]

  return (
    <div>
      <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#0b8da8]">
        Booking operations
      </p>
      <h1 className="mt-3 text-4xl font-black tracking-[-.05em]">Travel desk</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
        Proposals, traveler readiness, booking changes, waitlists, secure conversations, and
        reminders in one protected workspace.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Proposals', proposals.totalDocs, ScrollText],
          ['Change requests', changes.totalDocs, PlaneTakeoff],
          ['Conversations', conversations.totalDocs, MessageCircle],
          ['Notifications', notifications.totalDocs, Bell],
        ].map(([label, value, Icon]) => {
          const CardIcon = Icon as typeof Bell
          return (
            <div
              key={String(label)}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
            >
              <CardIcon size={19} className="text-[#0b8da8]" />
              <p className="mt-4 text-2xl font-black">{String(value)}</p>
              <p className="mt-1 text-xs font-bold text-slate-400">{String(label)}</p>
            </div>
          )
        })}
      </div>

      {user.role === 'agent' && (
        <section className="mt-6 rounded-[26px] border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Create a proposal</h2>
          <p className="mt-1 text-xs text-slate-400">
            Prepare a durable quote against live inventory.
          </p>
          <div className="mt-5">
            <ProposalForm
              trips={trips.docs.map((trip) => ({
                id: String(trip.id),
                title: trip.title,
                currency: trip.currency,
              }))}
            />
          </div>
          {proposals.docs.length > 0 && (
            <div className="mt-6 divide-y divide-slate-100 border-t border-slate-100">
              {proposals.docs.slice(0, 8).map((proposal) => (
                <div
                  key={proposal.id}
                  className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="text-sm font-extrabold">
                      {proposal.reference} · {proposal.travelerName}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {proposal.currency} {proposal.amount.toLocaleString()} · {proposal.status}
                    </p>
                  </div>
                  {proposal.status === 'draft' && <ProposalStatusForm id={String(proposal.id)} />}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="mt-6 rounded-[26px] border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black">Booking service</h2>
        <p className="mt-1 text-xs text-slate-400">
          Every request is tied to your signed-in identity and eligible booking inventory.
        </p>
        <div className="mt-5">
          <BookingOperationsForm
            orders={orders.docs.map((order) => ({
              id: String(order.id),
              reference: order.reference,
            }))}
            departures={departures.docs.map((departure) => ({
              id: String(departure.id),
              label: departure.label,
            }))}
            conversations={conversations.docs.map((conversation) => ({
              id: String(conversation.id),
              subject: conversation.subject,
              order:
                typeof conversation.order === 'string'
                  ? conversation.order
                  : String(conversation.order.id),
            }))}
          />
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <section className="rounded-[26px] border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <FileCheck2 size={21} className="text-[#0b8da8]" />
            <div>
              <h2 className="text-xl font-black">Traveler readiness</h2>
              <p className="text-xs text-slate-400">
                Sensitive data is private to your account and operations staff.
              </p>
            </div>
          </div>
          <div className="mt-5">
            <TravelerProfileForm
              profile={
                profile
                  ? {
                      id: String(profile.id),
                      fullName: profile.fullName,
                      nationality: profile.nationality ?? '',
                      dateOfBirth: dateInput(profile.dateOfBirth),
                      passportLastFour: profile.passportLastFour ?? '',
                      passportExpiry: dateInput(profile.passportExpiry),
                      dietaryNeeds: profile.dietaryNeeds ?? '',
                      accessibilityNeeds: profile.accessibilityNeeds ?? '',
                      emergencyContactName: profile.emergencyContactName ?? '',
                      emergencyContactPhone: profile.emergencyContactPhone ?? '',
                      emergencyContactRelation: profile.emergencyContactRelation ?? '',
                    }
                  : undefined
              }
            />
            <TravelerFileForm />
            {files.docs.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {files.docs.map((file) => (
                  <span
                    key={file.id}
                    className="rounded-full bg-slate-100 px-3 py-2 text-[11px] font-bold text-slate-500"
                  >
                    {file.label} · {file.documentType}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[26px] border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black">Notification center</h2>
            <div className="mt-4 space-y-3">
              {notifications.docs.slice(0, 8).map((notification) => (
                <div key={notification.id} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-extrabold">{notification.title}</p>
                  <p className="mt-1 text-[11px] leading-5 text-slate-400">{notification.body}</p>
                </div>
              ))}
              {notifications.docs.length === 0 && (
                <p className="text-xs text-slate-400">No notifications yet.</p>
              )}
            </div>
          </section>
          <section className="rounded-[26px] bg-[#0b2e4a] p-6 text-white">
            <h2 className="text-lg font-black">Recent secure messages</h2>
            <div className="mt-4 space-y-3">
              {messages.docs.slice(0, 6).map((message) => (
                <p
                  key={message.id}
                  className="rounded-xl bg-white/10 p-3 text-xs leading-5 text-white/65"
                >
                  {message.body}
                </p>
              ))}
              {messages.docs.length === 0 && (
                <p className="text-xs text-white/45">
                  Start a conversation from an eligible booking.
                </p>
              )}
            </div>
          </section>
          {(waitlists.totalDocs > 0 || changes.totalDocs > 0) && (
            <section className="rounded-[26px] border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black">Open service items</h2>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                {waitlists.totalDocs} waitlist entries · {changes.totalDocs} change requests
              </p>
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}
