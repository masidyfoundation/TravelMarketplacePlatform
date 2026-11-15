'use client'

import { LoaderCircle, Plus, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect } from 'react'
import {
  addStorefrontListing,
  initialStorefrontState,
  saveAgentProfile,
  updateStorefrontListing,
} from './actions'

function Result({ state }: { state: typeof initialStorefrontState }) {
  if (state.status === 'idle') return null
  return (
    <p
      className={`mt-3 rounded-xl px-3 py-2 text-xs font-bold ${state.status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}
    >
      {state.message}
    </p>
  )
}

function useRefresh(state: typeof initialStorefrontState) {
  const router = useRouter()
  useEffect(() => {
    if (state.status === 'success') router.refresh()
  }, [router, state.status])
}

export function AddListingForm({
  trips,
}: {
  trips: Array<{ id: string; title: string; commission: number }>
}) {
  const [state, action, pending] = useActionState(addStorefrontListing, initialStorefrontState)
  useRefresh(state)
  return (
    <form action={action} className="rounded-[26px] bg-[#0b2e4a] p-6 text-white">
      <p className="text-xs font-extrabold uppercase tracking-[.14em] text-[#70dce4]">
        Curate inventory
      </p>
      <h2 className="mt-2 text-xl font-black">Add a journey</h2>
      <select
        name="trip"
        required
        className="mt-5 w-full rounded-xl bg-white/10 px-3 py-3 text-sm outline-none"
      >
        <option value="" className="text-slate-900">
          Choose a journey
        </option>
        {trips.map((trip) => (
          <option key={trip.id} value={trip.id} className="text-slate-900">
            {trip.title} · {trip.commission}%
          </option>
        ))}
      </select>
      <input
        name="publicTitle"
        required
        minLength={3}
        placeholder="Your storefront title"
        className="mt-3 w-full rounded-xl bg-white/10 px-3 py-3 text-sm outline-none placeholder:text-white/40"
      />
      <textarea
        name="personalNote"
        required
        minLength={20}
        rows={5}
        placeholder="Why do you recommend this journey?"
        className="mt-3 w-full resize-none rounded-xl bg-white/10 px-3 py-3 text-sm leading-6 outline-none placeholder:text-white/40"
      />
      <button
        disabled={pending || trips.length === 0}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff654c] px-4 py-3 text-xs font-extrabold disabled:opacity-50"
      >
        {pending ? <LoaderCircle className="animate-spin" size={16} /> : <Plus size={16} />}
        Add as draft
      </button>
      <Result state={state} />
    </form>
  )
}

export function EditListingForm({
  listing,
}: {
  listing: {
    id: string
    publicTitle: string
    personalNote: string
    status: string
  }
}) {
  const [state, action, pending] = useActionState(updateStorefrontListing, initialStorefrontState)
  useRefresh(state)
  return (
    <form action={action} className="mt-4 space-y-3 border-t border-slate-100 pt-4">
      <input type="hidden" name="id" value={listing.id} />
      <input
        name="publicTitle"
        required
        minLength={3}
        defaultValue={listing.publicTitle}
        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold"
      />
      <textarea
        name="personalNote"
        required
        minLength={20}
        defaultValue={listing.personalNote}
        rows={3}
        className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm leading-6"
      />
      <div className="flex items-center gap-2">
        <select
          name="status"
          defaultValue={listing.status}
          className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold capitalize"
        >
          {['draft', 'active', 'archived'].map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <button
          disabled={pending}
          className="flex items-center gap-2 rounded-xl bg-[#0b2e4a] px-4 py-2.5 text-xs font-extrabold text-white disabled:opacity-50"
        >
          {pending ? <LoaderCircle className="animate-spin" size={15} /> : <Save size={15} />}
          Save
        </button>
      </div>
      <Result state={state} />
    </form>
  )
}

export function AgentProfileForm({
  profile,
}: {
  profile?: {
    id: string
    slug: string
    displayName: string
    tagline: string
    bio: string
    location: string
    specialties: string
    status: string
  }
}) {
  const [state, action, pending] = useActionState(saveAgentProfile, initialStorefrontState)
  useRefresh(state)
  return (
    <form
      action={action}
      className="mb-6 rounded-[26px] border border-slate-100 bg-white p-6 shadow-sm"
    >
      <input type="hidden" name="id" value={profile?.id ?? ''} />
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.14em] text-[#0b8da8]">
            Public identity
          </p>
          <h2 className="mt-1 text-xl font-black">Storefront profile</h2>
        </div>
        {profile?.status === 'published' && (
          <a href={`/agents/${profile.slug}`} className="text-xs font-extrabold text-[#0b8da8]">
            View public storefront
          </a>
        )}
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <input
          name="displayName"
          required
          defaultValue={profile?.displayName}
          placeholder="Public display name"
          className="rounded-xl border border-slate-200 px-3 py-3 text-sm"
        />
        <input
          name="slug"
          required
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          defaultValue={profile?.slug}
          placeholder="your-storefront-url"
          className="rounded-xl border border-slate-200 px-3 py-3 text-sm"
        />
        <input
          name="tagline"
          required
          defaultValue={profile?.tagline}
          placeholder="A short point of view on travel"
          className="rounded-xl border border-slate-200 px-3 py-3 text-sm sm:col-span-2"
        />
        <input
          name="location"
          defaultValue={profile?.location}
          placeholder="Based in..."
          className="rounded-xl border border-slate-200 px-3 py-3 text-sm"
        />
        <input
          name="specialties"
          defaultValue={profile?.specialties}
          placeholder="Adventure, family, design"
          className="rounded-xl border border-slate-200 px-3 py-3 text-sm"
        />
        <textarea
          name="bio"
          required
          minLength={40}
          defaultValue={profile?.bio}
          rows={4}
          placeholder="Tell travelers how you curate and support their journeys."
          className="resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm leading-6 sm:col-span-2"
        />
        <select
          name="status"
          defaultValue={profile?.status ?? 'draft'}
          className="rounded-xl border border-slate-200 px-3 py-3 text-sm font-bold capitalize"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
        <button
          disabled={pending}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#0b2e4a] px-4 py-3 text-xs font-extrabold text-white disabled:opacity-50"
        >
          {pending ? <LoaderCircle className="animate-spin" size={15} /> : <Save size={15} />}
          Save profile
        </button>
      </div>
      <Result state={state} />
    </form>
  )
}
