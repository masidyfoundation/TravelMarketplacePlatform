'use client'

import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Building2, Compass, KeyRound, Users } from 'lucide-react'
import { useState } from 'react'

export default function LoginForm({
  googleEnabled,
  authError,
}: {
  googleEnabled: boolean
  authError: boolean
}) {
  const [busy, setBusy] = useState(false)

  return (
    <div className="space-y-5">
      {authError && (
        <div
          role="alert"
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"
        >
          <p className="font-extrabold">Google sign-in couldn&apos;t be completed.</p>
          <p className="mt-1 text-xs leading-5 text-amber-800/80">
            No account changes were made. Please try again.
          </p>
        </div>
      )}

      <button
        type="button"
        disabled={!googleEnabled || busy}
        onClick={async () => {
          setBusy(true)
          await signIn('google', { redirectTo: '/dashboard' })
          setBusy(false)
        }}
        className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-extrabold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
      >
        <span className="grid size-7 place-items-center rounded-full bg-white text-base font-black text-[#4285F4] shadow-sm">
          G
        </span>
        {busy ? 'Connecting...' : 'Continue with Google'}
      </button>

      {!googleEnabled && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex gap-3">
            <KeyRound className="mt-0.5 shrink-0 text-amber-600" size={19} />
            <div>
              <p className="text-sm font-extrabold text-amber-900">
                Authentication is ready for credentials
              </p>
              <p className="mt-1 text-xs leading-5 text-amber-800/80">
                Add the Google environment variables in Make Secrets to activate sign-in.
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
