'use client'

import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { ArrowRight, Building2, CheckCircle2, Compass, KeyRound, Mail, Users } from 'lucide-react'
import { useState } from 'react'

export default function LoginForm({
  googleEnabled,
  emailEnabled,
  sent,
}: {
  googleEnabled: boolean
  emailEnabled: boolean
  sent: boolean
}) {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState<'google' | 'email' | null>(null)

  if (sent) {
    return (
      <div className="rounded-[28px] border border-emerald-100 bg-emerald-50 p-8 text-center">
        <CheckCircle2 className="mx-auto text-emerald-600" size={42} />
        <h2 className="mt-4 text-2xl font-black tracking-[-.04em] text-[#0b2944]">
          Check your inbox
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          We sent you a secure sign-in link. It expires automatically and works only once.
        </p>
      </div>
    )
  }

  const configured = googleEnabled || emailEnabled

  return (
    <div className="space-y-5">
      <button
        type="button"
        disabled={!googleEnabled || busy !== null}
        onClick={async () => {
          setBusy('google')
          await signIn('google', { redirectTo: '/dashboard' })
          setBusy(null)
        }}
        className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-extrabold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
      >
        <span className="grid size-7 place-items-center rounded-full bg-white text-base font-black text-[#4285F4] shadow-sm">
          G
        </span>
        {busy === 'google' ? 'Connecting...' : 'Continue with Google'}
      </button>

      <div className="flex items-center gap-3 text-xs font-bold text-slate-300">
        <span className="h-px flex-1 bg-slate-200" />
        OR USE A SECURE EMAIL LINK
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <form
        onSubmit={async (event) => {
          event.preventDefault()
          if (!emailEnabled || !email) return
          setBusy('email')
          await signIn('resend', { email, redirectTo: '/dashboard' })
          setBusy(null)
        }}
        className="space-y-3"
      >
        <label className="block">
          <span className="mb-2 block text-xs font-extrabold text-slate-600">
            Work or personal email
          </span>
          <span className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 focus-within:border-[#18a0b8] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#18a0b8]/10">
            <Mail size={18} className="text-slate-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              className="w-full bg-transparent py-3.5 text-sm outline-none"
            />
          </span>
        </label>
        <button
          type="submit"
          disabled={!emailEnabled || busy !== null}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0c2f4d] px-5 py-3.5 text-sm font-extrabold text-white transition hover:bg-[#153e60] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {busy === 'email' ? 'Sending link...' : 'Email me a sign-in link'}
          {!busy && <ArrowRight size={17} />}
        </button>
      </form>

      {!configured && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex gap-3">
            <KeyRound className="mt-0.5 shrink-0 text-amber-600" size={19} />
            <div>
              <p className="text-sm font-extrabold text-amber-900">
                Authentication is ready for credentials
              </p>
              <p className="mt-1 text-xs leading-5 text-amber-800/80">
                Add the Google and Resend environment variables in Make Secrets to activate these
                sign-in methods.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-[24px] border border-[#67cfd8]/25 bg-[#ecfafb] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-extrabold text-[#0b2944]">Explore without signing in</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Open the safe guest workspace and switch between all three roles.
            </p>
          </div>
          <span className="rounded-full bg-[#0b8da8] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.1em] text-white">
            Live demo
          </span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            ['Traveler', Compass],
            ['Agent', Users],
            ['Agency', Building2],
          ].map(([label, Icon]) => {
            const RoleIcon = Icon as typeof Compass
            return (
              <Link
                key={String(label)}
                href="/demo"
                className="flex flex-col items-center gap-2 rounded-xl bg-white px-2 py-3 text-center text-[11px] font-extrabold text-slate-600 shadow-sm transition hover:-translate-y-0.5"
              >
                <RoleIcon size={17} className="text-[#0b8da8]" />
                {String(label)}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
