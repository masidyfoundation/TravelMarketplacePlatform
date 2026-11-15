'use client'

import { LoaderCircle } from 'lucide-react'
import { useActionState } from 'react'
import { initialRefundState, requestRefund } from './actions'

export default function RefundForm({
  orders,
}: {
  orders: Array<{ id: string; reference: string; total: number; currency: string }>
}) {
  const [state, action, pending] = useActionState(requestRefund, initialRefundState)
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <select
        name="order"
        required
        className="rounded-xl border border-slate-200 px-3 py-3 text-sm"
      >
        {orders.map((order) => (
          <option key={order.id} value={order.id}>
            {order.reference} · {order.currency} {order.total}
          </option>
        ))}
      </select>
      <input
        name="amount"
        type="number"
        min="0.01"
        step="0.01"
        required
        placeholder="Refund amount"
        className="rounded-xl border border-slate-200 px-3 py-3 text-sm"
      />
      <textarea
        name="reason"
        required
        minLength={20}
        placeholder="Explain the refund request"
        className="resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm sm:col-span-2"
      />
      <button
        disabled={pending || orders.length === 0}
        className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-xs font-extrabold text-white disabled:opacity-50"
      >
        {pending && <LoaderCircle className="animate-spin" size={15} />}
        Request refund
      </button>
      {state.status !== 'idle' && (
        <p
          className={`rounded-xl px-3 py-2 text-xs font-bold ${
            state.status === 'success'
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-rose-50 text-rose-700'
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  )
}
