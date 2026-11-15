'use client'

import { LoaderCircle, Send, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect } from 'react'
import {
  createProposal,
  initialOperationState,
  joinWaitlist,
  requestOrderChange,
  saveTravelerProfile,
  sendProposal,
  sendOrderMessage,
  uploadTravelerFile,
} from './actions'

function useOperation(action: typeof saveTravelerProfile) {
  const value = useActionState(action, initialOperationState)
  const router = useRouter()
  useEffect(() => {
    if (value[0].status === 'success') router.refresh()
  }, [router, value[0].status])
  return value
}

function Result({ state }: { state: typeof initialOperationState }) {
  if (state.status === 'idle') return null
  return (
    <p
      className={`mt-3 rounded-xl px-3 py-2 text-xs font-bold ${state.status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}
    >
      {state.message}
    </p>
  )
}

const input = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none'

export function TravelerProfileForm({ profile }: { profile?: Record<string, string> }) {
  const [state, action, pending] = useOperation(saveTravelerProfile)
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={profile?.id ?? ''} />
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          name="fullName"
          required
          defaultValue={profile?.fullName}
          placeholder="Legal full name"
          className={input}
        />
        <input
          name="nationality"
          defaultValue={profile?.nationality}
          placeholder="Nationality"
          className={input}
        />
        <label className="text-[11px] font-bold text-slate-400">
          Date of birth
          <input
            name="dateOfBirth"
            type="date"
            defaultValue={profile?.dateOfBirth}
            className={`${input} mt-1`}
          />
        </label>
        <label className="text-[11px] font-bold text-slate-400">
          Passport expiry
          <input
            name="passportExpiry"
            type="date"
            defaultValue={profile?.passportExpiry}
            className={`${input} mt-1`}
          />
        </label>
        <input
          name="passportLastFour"
          minLength={4}
          maxLength={4}
          defaultValue={profile?.passportLastFour}
          placeholder="Passport last 4"
          className={input}
        />
        <input
          name="emergencyContactName"
          defaultValue={profile?.emergencyContactName}
          placeholder="Emergency contact"
          className={input}
        />
        <input
          name="emergencyContactPhone"
          defaultValue={profile?.emergencyContactPhone}
          placeholder="Emergency phone"
          className={input}
        />
        <input
          name="emergencyContactRelation"
          defaultValue={profile?.emergencyContactRelation}
          placeholder="Relationship"
          className={input}
        />
        <textarea
          name="dietaryNeeds"
          defaultValue={profile?.dietaryNeeds}
          placeholder="Dietary needs"
          className={`${input} resize-none`}
        />
        <textarea
          name="accessibilityNeeds"
          defaultValue={profile?.accessibilityNeeds}
          placeholder="Accessibility needs"
          className={`${input} resize-none`}
        />
      </div>
      <button
        disabled={pending}
        className="rounded-xl bg-[#0b2e4a] px-5 py-3 text-xs font-extrabold text-white disabled:opacity-50"
      >
        {pending ? 'Saving...' : 'Save traveler details'}
      </button>
      <Result state={state} />
    </form>
  )
}

export function TravelerFileForm() {
  const [state, action, pending] = useOperation(uploadTravelerFile)
  return (
    <form action={action} className="mt-5 grid gap-3 sm:grid-cols-2">
      <input name="label" required placeholder="Document label" className={input} />
      <select name="documentType" className={input}>
        {['passport', 'visa', 'insurance', 'medical', 'other'].map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
      <input
        name="file"
        type="file"
        required
        accept=".pdf,image/jpeg,image/png,image/webp"
        className={`${input} sm:col-span-2`}
      />
      <button
        disabled={pending}
        className="flex items-center justify-center gap-2 rounded-xl bg-[#0b8da8] px-5 py-3 text-xs font-extrabold text-white"
      >
        {pending ? <LoaderCircle className="animate-spin" size={15} /> : <Upload size={15} />}{' '}
        Upload privately
      </button>
      <Result state={state} />
    </form>
  )
}

export function ProposalForm({
  trips,
}: {
  trips: Array<{ id: string; title: string; currency: string }>
}) {
  const [state, action, pending] = useOperation(createProposal)
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <input name="travelerName" required placeholder="Traveler name" className={input} />
      <input
        name="travelerEmail"
        type="email"
        required
        placeholder="Traveler email"
        className={input}
      />
      <select name="trip" required className={`${input} sm:col-span-2`}>
        {trips.map((trip) => (
          <option key={trip.id} value={trip.id}>
            {trip.title}
          </option>
        ))}
      </select>
      <input name="travelers" type="number" min={1} max={20} defaultValue={2} className={input} />
      <input
        name="amount"
        type="number"
        min={0}
        required
        placeholder="Quote amount"
        className={input}
      />
      <select name="currency" className={input}>
        {['USD', 'EUR', 'GBP', 'AED'].map((code) => (
          <option key={code}>{code}</option>
        ))}
      </select>
      <input name="validUntil" type="date" required className={input} />
      <textarea
        name="message"
        required
        placeholder="Proposal details and inclusions"
        className={`${input} resize-none sm:col-span-2`}
      />
      <button
        disabled={pending}
        className="rounded-xl bg-[#0b2e4a] px-5 py-3 text-xs font-extrabold text-white"
      >
        Save proposal
      </button>
      <Result state={state} />
    </form>
  )
}

export function ProposalStatusForm({ id }: { id: string }) {
  const [state, action, pending] = useOperation(sendProposal)
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button
        disabled={pending}
        className="rounded-lg bg-[#0b2e4a] px-3 py-2 text-[11px] font-extrabold text-white"
      >
        {pending ? 'Sending...' : 'Mark sent'}
      </button>
      <span className="sr-only" aria-live="polite">
        {state.message}
      </span>
    </form>
  )
}

export function BookingOperationsForm({
  orders,
  departures,
  conversations,
}: {
  orders: Array<{ id: string; reference: string }>
  departures: Array<{ id: string; label: string }>
  conversations: Array<{ id: string; subject: string; order: string }>
}) {
  const [changeState, changeAction, changePending] = useOperation(requestOrderChange)
  const [waitState, waitAction, waitPending] = useOperation(joinWaitlist)
  const [messageState, messageAction, messagePending] = useOperation(sendOrderMessage)
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <form action={changeAction} className="rounded-2xl bg-slate-50 p-4">
        <h3 className="font-extrabold">Request a change</h3>
        <select name="order" className={`${input} mt-3`}>
          {orders.map((order) => (
            <option key={order.id} value={order.id}>
              {order.reference}
            </option>
          ))}
        </select>
        <select name="type" className={`${input} mt-3`}>
          <option value="amendment">Amendment</option>
          <option value="cancellation">Cancellation</option>
          <option value="refund">Refund</option>
        </select>
        <textarea
          name="details"
          required
          minLength={20}
          placeholder="Explain the request"
          className={`${input} mt-3 resize-none`}
        />
        <button
          disabled={changePending || orders.length === 0}
          className="mt-3 w-full rounded-xl bg-[#0b2e4a] px-4 py-3 text-xs font-extrabold text-white"
        >
          Submit request
        </button>
        <Result state={changeState} />
      </form>
      <form action={waitAction} className="rounded-2xl bg-slate-50 p-4">
        <h3 className="font-extrabold">Join a waitlist</h3>
        <select name="departure" className={`${input} mt-3`}>
          {departures.map((departure) => (
            <option key={departure.id} value={departure.id}>
              {departure.label}
            </option>
          ))}
        </select>
        <input
          name="travelers"
          type="number"
          min={1}
          max={20}
          defaultValue={2}
          className={`${input} mt-3`}
        />
        <textarea
          name="note"
          placeholder="Optional flexibility notes"
          className={`${input} mt-3 resize-none`}
        />
        <button
          disabled={waitPending || departures.length === 0}
          className="mt-3 w-full rounded-xl bg-[#0b8da8] px-4 py-3 text-xs font-extrabold text-white"
        >
          Join waitlist
        </button>
        <Result state={waitState} />
      </form>
      <form action={messageAction} className="rounded-2xl bg-slate-50 p-4">
        <h3 className="font-extrabold">Secure message</h3>
        <select name="order" className={`${input} mt-3`}>
          {orders.map((order) => (
            <option key={order.id} value={order.id}>
              {order.reference}
            </option>
          ))}
        </select>
        <input
          name="subject"
          required
          placeholder="Conversation subject"
          className={`${input} mt-3`}
        />
        <textarea
          name="body"
          required
          placeholder="Write a message"
          className={`${input} mt-3 resize-none`}
        />
        <button
          disabled={messagePending || orders.length === 0}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff654c] px-4 py-3 text-xs font-extrabold text-white"
        >
          <Send size={14} /> Send securely
        </button>
        <Result state={messageState} />
      </form>
    </div>
  )
}
