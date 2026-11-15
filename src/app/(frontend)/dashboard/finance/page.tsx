import Link from 'next/link'
import { ArrowDownToLine, CircleDollarSign, FileText, Landmark } from 'lucide-react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/current-user'
import { getPayloadClient } from '@/lib/payload'
import ConnectButton from './connect-button'
import RefundForm from './refund-form'

export default async function FinancePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const payload = await getPayloadClient()
  const [accounts, ledger, invoices, memberships, orders, payouts, refunds] = await Promise.all([
    payload.find({ collection: 'payment-accounts', user, overrideAccess: false, limit: 20 }),
    payload.find({
      collection: 'ledger-entries',
      user,
      overrideAccess: false,
      depth: 1,
      limit: 100,
      sort: '-createdAt',
    }),
    payload.find({
      collection: 'invoices',
      user,
      overrideAccess: false,
      depth: 1,
      limit: 100,
      sort: '-issuedAt',
    }),
    user.role === 'agency'
      ? payload.find({ collection: 'agency-memberships', user, overrideAccess: false, limit: 20 })
      : Promise.resolve({ docs: [] }),
    payload.find({
      collection: 'orders',
      user,
      overrideAccess: false,
      where: { status: { in: ['paid', 'confirmed', 'completed'] } },
      limit: 100,
      sort: '-createdAt',
    }),
    payload.find({
      collection: 'payout-statements',
      user,
      overrideAccess: false,
      limit: 100,
      sort: '-arrivalDate',
    }),
    payload.find({
      collection: 'refund-requests',
      user,
      overrideAccess: false,
      limit: 100,
      sort: '-createdAt',
    }),
  ])
  const balance = ledger.docs.reduce((sum, entry) => sum + entry.amount, 0)
  const agencyID =
    memberships.docs[0] &&
    (typeof memberships.docs[0].agency === 'string'
      ? memberships.docs[0].agency
      : String(memberships.docs[0].agency.id))
  const account = accounts.docs[0]

  return (
    <div>
      <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#0b8da8]">
        Finance operations
      </p>
      <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-4xl font-black tracking-[-.05em]">Money movement</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Connected payouts, transparent commissions, invoices, and reconciliation.
          </p>
        </div>
        {['agent', 'agency'].includes(user.role) && <ConnectButton agencyId={agencyID} />}
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          [
            'Ledger balance',
            balance.toLocaleString(undefined, { maximumFractionDigits: 2 }),
            CircleDollarSign,
          ],
          ['Invoices', invoices.totalDocs, FileText],
          ['Payout account', account?.status ?? 'Not connected', Landmark],
        ].map(([label, value, Icon]) => {
          const CardIcon = Icon as typeof Landmark
          return (
            <div
              key={String(label)}
              className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm"
            >
              <CardIcon className="text-[#0b8da8]" size={20} />
              <p className="mt-4 text-2xl font-black capitalize">{String(value)}</p>
              <p className="mt-1 text-xs font-bold text-slate-400">{String(label)}</p>
            </div>
          )
        })}
      </div>
      <section className="mt-6 rounded-[26px] border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-black">Commission and settlement ledger</h2>
          <Link
            href="/api/finance/export"
            className="flex items-center gap-2 text-xs font-extrabold text-[#0b8da8]"
          >
            <ArrowDownToLine size={15} /> Export CSV
          </Link>
        </div>
        <div className="mt-5 divide-y divide-slate-100">
          {ledger.docs.map((entry) => (
            <div key={entry.id} className="grid gap-2 py-3 text-sm sm:grid-cols-[1fr_1fr_auto]">
              <span className="font-extrabold capitalize">{entry.type.replaceAll('-', ' ')}</span>
              <span className="text-slate-400">
                {typeof entry.order === 'string' ? entry.order : entry.order.reference}
              </span>
              <span
                className={`font-black ${entry.amount < 0 ? 'text-rose-600' : 'text-emerald-600'}`}
              >
                {entry.currency} {entry.amount.toLocaleString()}
              </span>
            </div>
          ))}
          {ledger.docs.length === 0 && (
            <p className="py-10 text-center text-sm text-slate-400">
              Paid marketplace transactions will appear here.
            </p>
          )}
        </div>
      </section>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-[26px] border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Refunds</h2>
          <p className="mt-1 text-xs text-slate-400">
            Approved requests are processed through Stripe with idempotent ledger reversals.
          </p>
          <div className="mt-5">
            <RefundForm
              orders={orders.docs.map((order) => ({
                id: String(order.id),
                reference: order.reference,
                total: order.total,
                currency: order.currency,
              }))}
            />
          </div>
          {refunds.docs.length > 0 && (
            <div className="mt-4 space-y-2">
              {refunds.docs.slice(0, 5).map((refund) => (
                <p
                  key={refund.id}
                  className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold capitalize"
                >
                  {refund.status} · {refund.amount}
                </p>
              ))}
            </div>
          )}
        </section>
        <section className="rounded-[26px] border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Payout statements</h2>
          <div className="mt-4 space-y-2">
            {payouts.docs.slice(0, 10).map((payout) => (
              <div
                key={payout.id}
                className="flex justify-between rounded-xl bg-slate-50 px-3 py-3 text-xs"
              >
                <span className="font-bold capitalize">{payout.status}</span>
                <span className="font-black">
                  {payout.currency} {payout.amount.toLocaleString()}
                </span>
              </div>
            ))}
            {payouts.docs.length === 0 && (
              <p className="text-xs text-slate-400">Stripe payouts will appear here.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
