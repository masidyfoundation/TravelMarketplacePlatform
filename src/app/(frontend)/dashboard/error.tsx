'use client'

import { signOut } from 'next-auth/react'

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6">
      <section className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#0b8da8]">
          Workspace recovery
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-[-.04em] text-[#0b2944]">
          We could not load your dashboard
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Try loading the workspace again. If your session is no longer valid, sign out safely and
          return to the home page.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="rounded-xl bg-[#0b2944] px-5 py-3 text-sm font-extrabold text-white"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => signOut({ redirectTo: '/' })}
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-extrabold text-slate-700"
          >
            Sign out
          </button>
        </div>
      </section>
    </main>
  )
}
