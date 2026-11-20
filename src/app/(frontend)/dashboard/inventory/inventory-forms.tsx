'use client'

import { Building2, LoaderCircle, Plus, Save, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect } from 'react'
import {
  createDeparture,
  createTrip,
  initialInventoryState,
  saveAgencyProfile,
  updateDeparture,
  updateTripDetails,
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

export function AgencyProfileForm({
  agency,
}: {
  agency: {
    id: string
    name: string
    slug: string
    location: string
    specialty: string
    description: string
    website: string
    contactEmail: string
    supportPhone: string
    languages: string
    licenses: string
    status: string
    hasCoverImage: boolean
    payoutsEnabled: boolean
  }
}) {
  const [state, action, pending] = useActionState(saveAgencyProfile, initialInventoryState)
  useRefreshOnSuccess(state)
  const ready = Boolean(
    agency.website &&
    agency.contactEmail &&
    agency.supportPhone &&
    agency.licenses &&
    agency.hasCoverImage &&
    agency.payoutsEnabled,
  )
  return (
    <form action={action} className="rounded-[26px] border border-slate-100 bg-white p-6 shadow-sm">
      <input type="hidden" name="id" value={agency.id} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.14em] text-[#0b8da8]">
            Provider profile
          </p>
          <h2 className="mt-2 text-xl font-black">{agency.name}</h2>
        </div>
        <span
          className={`rounded-full px-3 py-1.5 text-[10px] font-extrabold uppercase ${
            ready ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
          }`}
        >
          {agency.status === 'verified' ? 'Verified' : ready ? 'Ready for review' : 'Incomplete'}
        </span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {[
          ['name', 'Business name', agency.name],
          ['slug', 'Public URL', agency.slug],
          ['location', 'Location', agency.location],
          ['specialty', 'Specialty', agency.specialty],
          ['website', 'Website', agency.website],
          ['contactEmail', 'Contact email', agency.contactEmail],
          ['supportPhone', 'Support phone', agency.supportPhone],
          ['languages', 'Languages, comma separated', agency.languages],
        ].map(([name, label, value]) => (
          <label key={name} className="text-[11px] font-bold text-slate-500">
            {label}
            <input
              name={name}
              defaultValue={value}
              required={!['languages'].includes(name)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#0b8da8]"
            />
          </label>
        ))}
      </div>
      <label className="mt-3 block text-[11px] font-bold text-slate-500">
        Public description
        <textarea
          name="description"
          defaultValue={agency.description}
          required
          minLength={40}
          rows={4}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#0b8da8]"
        />
      </label>
      <label className="mt-3 block text-[11px] font-bold text-slate-500">
        Licenses — one per line as Authority | Number
        <textarea
          name="licenses"
          defaultValue={agency.licenses}
          rows={3}
          placeholder="Italian Tourism Authority | ABC-12345"
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#0b8da8]"
        />
      </label>
      <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-200 p-4 text-xs font-bold text-slate-500">
        <Upload size={18} className="text-[#0b8da8]" />
        {agency.hasCoverImage ? 'Replace cover image' : 'Upload cover image'}
        <input
          name="coverImage"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
        />
      </label>
      <button
        disabled={pending}
        className="mt-4 flex items-center gap-2 rounded-xl bg-[#0b2e4a] px-4 py-3 text-xs font-extrabold text-white disabled:opacity-50"
      >
        {pending ? <LoaderCircle className="animate-spin" size={16} /> : <Save size={16} />}
        Save provider profile
      </button>
      <Result state={state} />
    </form>
  )
}

export function NewTripForm({ agencies }: { agencies: Array<{ id: string; name: string }> }) {
  const [state, action, pending] = useActionState(createTrip, initialInventoryState)
  useRefreshOnSuccess(state)
  return (
    <form action={action} className="rounded-[28px] bg-[#0b2e4a] p-6 text-white sm:p-8">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-white/10 text-[#70dce4]">
          <Building2 size={21} />
        </span>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.14em] text-[#70dce4]">
            New inventory
          </p>
          <h2 className="mt-1 text-2xl font-black">Create a trip draft</h2>
        </div>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <select name="agency" required className="rounded-xl bg-white/10 px-3 py-3 text-sm">
          {agencies.map((agency) => (
            <option key={agency.id} value={agency.id} className="text-slate-900">
              {agency.name}
            </option>
          ))}
        </select>
        <input
          name="title"
          required
          minLength={3}
          placeholder="Trip title"
          className="rounded-xl bg-white/10 px-3 py-3 text-sm placeholder:text-white/40"
        />
        <input
          name="slug"
          required
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          placeholder="public-trip-url"
          className="rounded-xl bg-white/10 px-3 py-3 text-sm placeholder:text-white/40"
        />
        <input
          name="destination"
          required
          placeholder="Destination"
          className="rounded-xl bg-white/10 px-3 py-3 text-sm placeholder:text-white/40"
        />
        <input
          name="country"
          required
          placeholder="Country"
          className="rounded-xl bg-white/10 px-3 py-3 text-sm placeholder:text-white/40"
        />
        <select name="category" className="rounded-xl bg-white/10 px-3 py-3 text-sm">
          {['beach', 'culture', 'adventure', 'wellness', 'luxury'].map((value) => (
            <option key={value} value={value} className="text-slate-900">
              {value}
            </option>
          ))}
        </select>
        <input
          name="durationDays"
          type="number"
          min={1}
          required
          placeholder="Days"
          className="rounded-xl bg-white/10 px-3 py-3 text-sm placeholder:text-white/40"
        />
        <input
          name="price"
          type="number"
          min={0}
          step="0.01"
          required
          placeholder="Price per person"
          className="rounded-xl bg-white/10 px-3 py-3 text-sm placeholder:text-white/40"
        />
        <select name="currency" className="rounded-xl bg-white/10 px-3 py-3 text-sm">
          {['EUR', 'USD', 'GBP', 'AED'].map((value) => (
            <option key={value} value={value} className="text-slate-900">
              {value}
            </option>
          ))}
        </select>
        <input
          name="agentCommission"
          type="number"
          min={0}
          max={50}
          step="0.1"
          required
          placeholder="Agent commission %"
          className="rounded-xl bg-white/10 px-3 py-3 text-sm placeholder:text-white/40"
        />
        <input
          name="tagline"
          required
          minLength={10}
          placeholder="Short sales tagline"
          className="rounded-xl bg-white/10 px-3 py-3 text-sm placeholder:text-white/40 md:col-span-2"
        />
        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-3 text-xs font-bold text-white/70">
          <Upload size={16} /> Hero image
          <input
            name="heroImage"
            type="file"
            required
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
          />
        </label>
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <textarea
          name="summary"
          required
          minLength={40}
          rows={4}
          placeholder="Trip summary"
          className="rounded-xl bg-white/10 px-3 py-3 text-sm placeholder:text-white/40"
        />
        <textarea
          name="cancellationPolicy"
          required
          minLength={40}
          rows={4}
          placeholder="Provider cancellation policy"
          className="rounded-xl bg-white/10 px-3 py-3 text-sm placeholder:text-white/40"
        />
        <textarea
          name="highlights"
          rows={4}
          placeholder={'Highlights — one per line'}
          className="rounded-xl bg-white/10 px-3 py-3 text-sm placeholder:text-white/40"
        />
        <textarea
          name="inclusions"
          rows={4}
          placeholder={'Inclusions — one per line'}
          className="rounded-xl bg-white/10 px-3 py-3 text-sm placeholder:text-white/40"
        />
        <textarea
          name="itinerary"
          rows={4}
          placeholder={'Itinerary — Day number | Title | Description'}
          className="rounded-xl bg-white/10 px-3 py-3 text-sm placeholder:text-white/40 lg:col-span-2"
        />
        <input
          name="accommodation"
          placeholder="Accommodation"
          className="rounded-xl bg-white/10 px-3 py-3 text-sm placeholder:text-white/40"
        />
        <input
          name="transport"
          placeholder="Transport"
          className="rounded-xl bg-white/10 px-3 py-3 text-sm placeholder:text-white/40"
        />
        <input
          name="meetingPoint"
          placeholder="Meeting point"
          className="rounded-xl bg-white/10 px-3 py-3 text-sm placeholder:text-white/40 lg:col-span-2"
        />
      </div>
      <button
        disabled={pending}
        className="mt-5 flex items-center gap-2 rounded-xl bg-[#ff654c] px-5 py-3 text-xs font-extrabold disabled:opacity-50"
      >
        {pending ? <LoaderCircle className="animate-spin" size={16} /> : <Plus size={16} />}
        Create draft
      </button>
      <Result state={state} />
    </form>
  )
}

type EditableTrip = {
  id: string
  title: string
  slug: string
  destination: string
  country: string
  category: string
  durationDays: number
  price: number
  currency: string
  agentCommission: number
  tagline: string
  summary: string
  cancellationPolicy: string
  accommodation: string
  transport: string
  meetingPoint: string
  highlights: string
  inclusions: string
  itinerary: string
}

export function EditTripForm({ trip }: { trip: EditableTrip }) {
  const [state, action, pending] = useActionState(updateTripDetails, initialInventoryState)
  useRefreshOnSuccess(state)
  return (
    <details className="mt-5 rounded-2xl border border-slate-100 bg-slate-50">
      <summary className="cursor-pointer px-4 py-3 text-xs font-extrabold text-[#0b8da8]">
        Edit full trip details
      </summary>
      <form action={action} className="border-t border-slate-100 p-4">
        <input type="hidden" name="id" value={trip.id} />
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {[
            ['title', 'Title', trip.title],
            ['slug', 'Public URL', trip.slug],
            ['destination', 'Destination', trip.destination],
            ['country', 'Country', trip.country],
          ].map(([name, label, value]) => (
            <label key={name} className="text-[11px] font-bold text-slate-500">
              {label}
              <input
                name={name}
                defaultValue={value}
                required
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
              />
            </label>
          ))}
          <label className="text-[11px] font-bold text-slate-500">
            Category
            <select
              name="category"
              defaultValue={trip.category}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
            >
              {['beach', 'culture', 'adventure', 'wellness', 'luxury'].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[11px] font-bold text-slate-500">
            Days
            <input
              name="durationDays"
              type="number"
              min={1}
              defaultValue={trip.durationDays}
              required
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
            />
          </label>
          <label className="text-[11px] font-bold text-slate-500">
            Price
            <input
              name="price"
              type="number"
              min={0}
              step="0.01"
              defaultValue={trip.price}
              required
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
            />
          </label>
          <label className="text-[11px] font-bold text-slate-500">
            Currency
            <select
              name="currency"
              defaultValue={trip.currency}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
            >
              {['EUR', 'USD', 'GBP', 'AED'].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[11px] font-bold text-slate-500">
            Agent commission %
            <input
              name="agentCommission"
              type="number"
              min={0}
              max={50}
              step="0.1"
              defaultValue={trip.agentCommission}
              required
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
            />
          </label>
          <label className="text-[11px] font-bold text-slate-500 md:col-span-2">
            Tagline
            <input
              name="tagline"
              defaultValue={trip.tagline}
              required
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
            />
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-white px-3 py-3 text-xs font-bold text-slate-500">
            <Upload size={16} /> Replace hero image
            <input
              name="heroImage"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
            />
          </label>
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {[
            ['summary', 'Summary', trip.summary],
            ['cancellationPolicy', 'Cancellation policy', trip.cancellationPolicy],
            ['highlights', 'Highlights — one per line', trip.highlights],
            ['inclusions', 'Inclusions — one per line', trip.inclusions],
            ['itinerary', 'Itinerary — Day | Title | Description', trip.itinerary],
          ].map(([name, placeholder, value]) => (
            <textarea
              key={name}
              name={name}
              defaultValue={value}
              required
              rows={4}
              placeholder={placeholder}
              className={`rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm ${
                name === 'itinerary' ? 'lg:col-span-2' : ''
              }`}
            />
          ))}
          <input
            name="accommodation"
            defaultValue={trip.accommodation}
            required
            placeholder="Accommodation"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
          />
          <input
            name="transport"
            defaultValue={trip.transport}
            required
            placeholder="Transport"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
          />
          <input
            name="meetingPoint"
            defaultValue={trip.meetingPoint}
            required
            placeholder="Meeting point"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm lg:col-span-2"
          />
        </div>
        <button
          disabled={pending}
          className="mt-4 flex items-center gap-2 rounded-xl bg-[#0b2e4a] px-4 py-3 text-xs font-extrabold text-white disabled:opacity-50"
        >
          {pending ? <LoaderCircle className="animate-spin" size={16} /> : <Save size={16} />}
          Save trip details
        </button>
        <Result state={state} />
      </form>
    </details>
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
        {Array.from(
          new Set([
            trip.status,
            'draft',
            ...(trip.status === 'active' ? ['paused'] : ['review', 'paused']),
          ]),
        ).map((status) => (
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
