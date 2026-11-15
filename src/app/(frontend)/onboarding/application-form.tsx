'use client'

import { Check, LoaderCircle, Send } from 'lucide-react'
import { useActionState } from 'react'
import { initialApplicationState, submitApplication } from './actions'

type ApplicationDefaults = {
  type: 'agent' | 'agency'
  businessName: string
  country: string
  phone: string
  website: string
  specialties: string
  experience: string
}

export default function ApplicationForm({ application }: { application?: ApplicationDefaults }) {
  const [state, formAction, pending] = useActionState(submitApplication, initialApplicationState)

  if (state.status === 'success') {
    return (
      <div className="rounded-[28px] border border-emerald-100 bg-emerald-50 p-8 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-600 text-white">
          <Check size={26} />
        </span>
        <h2 className="mt-4 text-2xl font-black tracking-[-.04em]">Application received</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600">{state.message}</p>
      </div>
    )
  }

  const field = (name: string, label: string, placeholder: string, type = 'text') => (
    <label className="block">
      <span className="mb-2 block text-xs font-extrabold text-slate-600">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={application?.[name as keyof ApplicationDefaults] ?? ''}
        className={`w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm outline-none focus:bg-white focus:ring-4 ${
          state.fieldErrors?.[name]
            ? 'border-red-300 focus:ring-red-100'
            : 'border-slate-200 focus:border-[#1aa2b7] focus:ring-[#1aa2b7]/10'
        }`}
      />
      {state.fieldErrors?.[name] && (
        <span className="mt-1 block text-xs font-bold text-red-500">{state.fieldErrors[name]}</span>
      )}
    </label>
  )

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs font-extrabold text-slate-600">Application type</span>
          <select
            name="type"
            defaultValue={application?.type ?? 'agent'}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-[#1aa2b7]"
          >
            <option value="agent">Travel agent</option>
            <option value="agency">Travel agency</option>
          </select>
        </label>
        {field('businessName', 'Business or professional name', 'Meridian Travel')}
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {field('country', 'Operating country', 'United Arab Emirates')}
        {field('phone', 'Contact number', '+971 ...', 'tel')}
      </div>
      {field('website', 'Website (optional)', 'https://...')}
      {field('specialties', 'Specialties', 'Luxury, adventure, family travel')}
      <label className="block">
        <span className="mb-2 block text-xs font-extrabold text-slate-600">
          Experience and operating model
        </span>
        <textarea
          name="experience"
          defaultValue={application?.experience ?? ''}
          rows={6}
          placeholder="Tell us about your travel experience, audience, destinations, licenses, and how you plan to use Masidy..."
          className={`w-full resize-none rounded-xl border bg-slate-50 px-4 py-3 text-sm leading-6 outline-none focus:bg-white focus:ring-4 ${
            state.fieldErrors?.experience
              ? 'border-red-300 focus:ring-red-100'
              : 'border-slate-200 focus:border-[#1aa2b7] focus:ring-[#1aa2b7]/10'
          }`}
        />
        {state.fieldErrors?.experience && (
          <span className="mt-1 block text-xs font-bold text-red-500">
            {state.fieldErrors.experience}
          </span>
        )}
      </label>
      {state.status === 'error' && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff6047] px-5 py-3.5 text-sm font-extrabold text-white disabled:opacity-60"
      >
        {pending ? (
          <>
            <LoaderCircle size={17} className="animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Send size={17} />
            {application ? 'Resubmit for verification' : 'Submit for verification'}
          </>
        )}
      </button>
    </form>
  )
}
