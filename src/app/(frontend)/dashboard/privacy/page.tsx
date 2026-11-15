import Link from 'next/link'
import { Download, ShieldCheck, Trash2 } from 'lucide-react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/current-user'
import { getPayloadClient } from '@/lib/payload'
import { requestDeletion, updateConsent } from './actions'

export default async function PrivacyPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const payload = await getPayloadClient()
  const [requests, consents] = await Promise.all([
    payload.find({
      collection: 'data-requests',
      user,
      overrideAccess: false,
      limit: 20,
      sort: '-createdAt',
    }),
    payload.find({
      collection: 'consents',
      user,
      overrideAccess: false,
      limit: 20,
    }),
  ])
  return (
    <div>
      <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#0b8da8]">
        Privacy controls
      </p>
      <h1 className="mt-3 text-4xl font-black tracking-[-.05em]">Your data</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
        Export your account data or start a verified deletion workflow. Deletion is reviewed first
        to preserve financial and legal records that must be retained.
      </p>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <section className="rounded-[26px] border border-slate-100 bg-white p-6 shadow-sm">
          <Download className="text-[#0b8da8]" />
          <h2 className="mt-4 text-xl font-black">Download your data</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Receive a machine-readable JSON export of your profile and owned records.
          </p>
          <Link
            href="/api/privacy/export"
            className="mt-5 inline-flex rounded-xl bg-[#0b2e4a] px-5 py-3 text-xs font-extrabold text-white"
          >
            Export now
          </Link>
        </section>
        <section className="rounded-[26px] border border-rose-100 bg-white p-6 shadow-sm">
          <Trash2 className="text-rose-500" />
          <h2 className="mt-4 text-xl font-black">Request account deletion</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Operations will verify your identity, settle open bookings, and apply retention rules.
          </p>
          <form action={requestDeletion}>
            <button className="mt-5 rounded-xl bg-rose-600 px-5 py-3 text-xs font-extrabold text-white">
              Request deletion review
            </button>
          </form>
        </section>
      </div>
      <section className="mt-6 rounded-[26px] border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="font-black">Consent preferences</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {['marketing', 'analytics'].map((type) => {
            const consent = consents.docs.find((item) => item.type === type)
            return (
              <form key={type} action={updateConsent} className="rounded-xl bg-slate-50 p-4">
                <input type="hidden" name="type" value={type} />
                <p className="text-sm font-extrabold capitalize">{type}</p>
                <p className="mt-1 text-xs text-slate-400">
                  Currently {consent?.granted ? 'allowed' : 'not allowed'}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    name="granted"
                    value="true"
                    className="rounded-lg bg-[#0b2e4a] px-3 py-2 text-[11px] font-bold text-white"
                  >
                    Allow
                  </button>
                  <button
                    name="granted"
                    value="false"
                    className="rounded-lg bg-white px-3 py-2 text-[11px] font-bold text-slate-500"
                  >
                    Withdraw
                  </button>
                </div>
              </form>
            )
          })}
        </div>
      </section>
      <section className="mt-6 rounded-[26px] border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-emerald-600" size={20} />
          <h2 className="font-black">Request history</h2>
        </div>
        <div className="mt-4 space-y-2">
          {requests.docs.map((request) => (
            <p
              key={request.id}
              className="rounded-xl bg-slate-50 px-4 py-3 text-xs font-bold capitalize"
            >
              {request.type} · {request.status}
            </p>
          ))}
          {requests.docs.length === 0 && (
            <p className="text-xs text-slate-400">No privacy requests.</p>
          )}
        </div>
      </section>
    </div>
  )
}
