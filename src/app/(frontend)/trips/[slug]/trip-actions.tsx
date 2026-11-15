'use client'

import { ArrowRight, CreditCard, ShieldCheck } from 'lucide-react'
import { useState } from 'react'

export default function TripActions({
  tripId,
  price,
  currency,
  departures,
}: {
  tripId: string
  price: number
  currency: string
  departures: Array<{
    id: string
    label: string
    startDate: string
    remaining: number
  }>
}) {
  const [travelers, setTravelers] = useState(2)
  const [departureId, setDepartureId] = useState(departures[0]?.id ?? '')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const checkout = async () => {
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          tripId,
          travelers,
          departureId: departureId || undefined,
          agentSlug: new URLSearchParams(window.location.search).get('agent'),
        }),
      })
      if (response.status === 401) {
        window.location.assign('/login')
        return
      }
      const result = (await response.json()) as { url?: string; error?: string }
      if (!response.ok || !result.url) {
        setMessage(result.error || 'Checkout could not be started.')
        return
      }
      window.location.assign(result.url)
    } catch {
      setMessage('Checkout could not be started.')
    } finally {
      setBusy(false)
    }
  }

  const total = price * travelers

  return (
    <div className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-[0_20px_60px_rgba(16,49,72,.12)] sm:p-6">
      <p className="text-xs font-extrabold uppercase tracking-[.14em] text-slate-400">
        Secure booking
      </p>
      <div className="mt-3 flex items-end justify-between">
        <div>
          <span className="text-3xl font-black tracking-[-.04em]">
            {currency} {price.toLocaleString()}
          </span>
          <span className="ml-2 text-xs text-slate-400">per traveler</span>
        </div>
      </div>
      <label className="mt-5 block">
        <span className="mb-2 block text-xs font-extrabold text-slate-600">Travelers</span>
        <select
          value={travelers}
          onChange={(event) => setTravelers(Number(event.target.value))}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none"
        >
          {Array.from({ length: 10 }, (_, index) => index + 1).map((count) => (
            <option key={count} value={count}>
              {count} traveler{count > 1 ? 's' : ''}
            </option>
          ))}
        </select>
      </label>
      {departures.length > 0 && (
        <label className="mt-4 block">
          <span className="mb-2 block text-xs font-extrabold text-slate-600">Departure</span>
          <select
            value={departureId}
            onChange={(event) => setDepartureId(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none"
          >
            {departures.map((departure) => (
              <option key={departure.id} value={departure.id}>
                {departure.label} · {new Date(departure.startDate).toLocaleDateString()} ·{' '}
                {departure.remaining} left
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="text-sm font-bold text-slate-500">Estimated total</span>
        <span className="text-lg font-black">
          {currency} {total.toLocaleString()}
        </span>
      </div>
      <button
        type="button"
        onClick={checkout}
        disabled={busy || (departures.length > 0 && !departureId)}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff6047] px-5 py-3.5 text-sm font-extrabold text-white disabled:opacity-60"
      >
        <CreditCard size={17} />
        {busy ? 'Opening checkout...' : 'Book securely'}
        {!busy && <ArrowRight size={16} />}
      </button>
      {message && (
        <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-xs font-bold leading-5 text-amber-700">
          {message}
        </p>
      )}
      <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
        <ShieldCheck size={13} />
        Protected checkout and verified fulfillment
      </p>
    </div>
  )
}
