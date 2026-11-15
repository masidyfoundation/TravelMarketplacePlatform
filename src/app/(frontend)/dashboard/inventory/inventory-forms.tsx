'use client'

import { LoaderCircle, Plus, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect } from 'react'
import {
  createDeparture,
  initialInventoryState,
  updateDeparture,
  updateTripStatus,
} from './actions'

function Result({ state }: { state: typeof initialInventoryState }) {
  if (state.status === 'idle') return null
  return (
    <p
      className={`mt-3 rounded-xl px-3 py-2 text-xs font-bold ${
        state.status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
      }`}
    >
      {state.message}
    </p>
  )
}

function useRefreshOnSuccess(state: typeof initialInventoryState) {
  const router = useRouter()
  useEffect(() => {
    if (state.status === 'success') router.refresh()
  }, [router, state.status])
}

export function NewDepartureForm({ trips }: { trips: Array<{ id: string; title: string }> }) {
  const [state, action, pending] = useActionState(createDeparture, initialInventoryState)
  useRefreshOnSuccess(state)
  return (
    <form action={action} className="rounded-[26px] bg-[#0b2e4a] p-6 text-white">
      <p className="text-xs font-extrabold uppercase tracking-[.14em] text-[#70dce4]">
        Add availability
      </p>
      <h2 className="mt-2 text-xl font-black">New departure</h2>
      <div className="mt-5 space-y-3">
        <select
          name="trip"
          required
          className="w-full rounded-xl bg-white/10 px-3 py-3 text-sm outline-none"
        >
          <option value="" className="text-slate-900">
            Choose a journey
          </option>
          {trips.map((trip) => (
            <option key={trip.id} value={trip.id} className="text-slate-900">
              {trip.title}
            </option>
          ))}
        </select>
        <input
          name="label"
          required
          minLength={3}
          placeholder="Departure label"
          className="w-full rounded-xl bg-white/10 px-3 py-3 text-sm outline-none placeholder:text-white/40"
        />
        <div className="grid grid-cols-2 gap-3">
          <label className="text-[11px] font-bold text-white/55">
            Starts
            <input
              name="startDate"
              type="date"
              required
              className="mt-1 w-full rounded-xl bg-white/10 px-3 py-3 text-sm text-white outline-none"
            />
          </label>
          <label className="text-[11px] font-bold text-white/55">
            Ends
            <input
              name="endDate"
              type="date"
              required
              className="mt-1 w-full rounded-xl bg-white/10 px-3 py-3 text-sm text-white outline-none"
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input
            name="capacity"
            type="number"
            min={1}
            required
            placeholder="Capacity"
            className="w-full rounded-xl bg-white/10 px-3 py-3 text-sm outline-none placeholder:text-white/40"
          />
          <input
            name="priceOverride"
            type="number"
            min={0}
            placeholder="Price override"
            className="w-full rounded-xl bg-white/10 px-3 py-3 text-sm outline-none placeholder:text-white/40"
          />
        </div>
      </div>
      <button
        disabled={pending || trips.length === 0}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff654c] px-4 py-3 text-xs font-extrabold disabled:opacity-50"
      >
        {pending ? <LoaderCircle className="animate-spin" size={16} /> : <Plus size={16} />}
        Add departure
      </button>
      <Result state={state} />
    </form>
  )
}

export function DepartureForm({
  departure,
}: {
  departure: {
    id: string
    status: string
    capacity: number
    booked: number
  }
}) {
  const [state, action, pending] = useActionState(updateDeparture, initialInventoryState)
  useRefreshOnSuccess(state)
  return (
    <form
      action={action}
      className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-[1fr_1fr_1.3fr_auto] sm:items-end"
    >
      <input type="hidden" name="id" value={departure.id} />
      <label className="text-[11px] font-bold text-slate-400">
        Capacity
        <input
          name="capacity"
          type="number"
          min={1}
          defaultValue={departure.capacity}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700"
        />
      </label>
      <label className="text-[11px] font-bold text-slate-400">
        Booked
        <input
          name="booked"
          type="number"
          min={0}
          defaultValue={departure.booked}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700"
        />
      </label>
      <label className="text-[11px] font-bold text-slate-400">
        Status
        <select
          name="status"
          defaultValue={departure.status}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm capitalize text-slate-700"
        >
          {['open', 'guaranteed', 'sold-out', 'closed', 'cancelled'].map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>
      <button
        disabled={pending}
        aria-label="Save departure"
        className="grid size-10 place-items-center rounded-xl bg-[#0b2e4a] text-white disabled:opacity-50"
      >
        {pending ? <LoaderCircle className="animate-spin" size={16} /> : <Save size={16} />}
      </button>
      <div className="sm:col-span-4">
        <Result state={state} />
      </div>
    </form>
  )
}

export function TripStatusForm({ trip }: { trip: { id: string; status: string } }) {
  const [state, action, pending] = useActionState(updateTripStatus, initialInventoryState)
  useRefreshOnSuccess(state)
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="id" value={trip.id} />
      <select
        name="status"
        defaultValue={trip.status}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold capitalize"
      >
        {['draft', 'active', 'paused'].map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
      <button
        disabled={pending}
        className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-extrabold text-slate-600 disabled:opacity-50"
      >
        {pending ? 'Saving' : 'Update'}
      </button>
      <span className="sr-only" aria-live="polite">
        {state.message}
      </span>
    </form>
  )
}
