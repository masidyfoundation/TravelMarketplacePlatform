import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/current-user'
import { hasRequiredConsents } from '@/lib/required-consents'
import { acceptRequiredConsents } from './actions'

export default async function ConsentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (await hasRequiredConsents(user)) redirect('/dashboard')
  const { error } = await searchParams
  return (
    <main className="min-h-screen bg-[#f5f7f7] px-5 py-12 text-[#0b2944] sm:px-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/">
          <Image
            src="/masidy-logo.png"
            alt="Masidy"
            width={959}
            height={313}
            className="h-12 w-auto"
            priority
          />
        </Link>
        <section className="mt-10 rounded-[30px] border border-slate-100 bg-white p-7 shadow-sm sm:p-10">
          <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#0b8da8]">
            Account setup
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-[-.05em]">
            Review the rules of the marketplace.
          </h1>
          <p className="mt-4 leading-7 text-slate-500">
            Before using Masidy, confirm that you understand our role as a marketplace intermediary
            and how we process your information.
          </p>
          <form action={acceptRequiredConsents} className="mt-8 space-y-4">
            <label className="flex gap-3 rounded-2xl border border-slate-200 p-4">
              <input
                type="checkbox"
                name="terms"
                value="accepted"
                required
                className="mt-1 size-4 accent-[#0b8da8]"
              />
              <span className="text-sm leading-6 text-slate-600">
                I accept the{' '}
                <Link href="/legal/terms" target="_blank" className="font-bold text-[#0b8da8]">
                  Terms of Service
                </Link>
                .
              </span>
            </label>
            <label className="flex gap-3 rounded-2xl border border-slate-200 p-4">
              <input
                type="checkbox"
                name="privacy"
                value="accepted"
                required
                className="mt-1 size-4 accent-[#0b8da8]"
              />
              <span className="text-sm leading-6 text-slate-600">
                I acknowledge the{' '}
                <Link href="/legal/privacy" target="_blank" className="font-bold text-[#0b8da8]">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
            {error && (
              <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                {error === 'policy'
                  ? 'The current policies are temporarily unavailable.'
                  : 'Accept both policies to continue.'}
              </p>
            )}
            <button className="w-full rounded-xl bg-[#0b2e4a] px-5 py-3.5 text-sm font-extrabold text-white">
              Accept and continue
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
