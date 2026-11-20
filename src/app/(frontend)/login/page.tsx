import Image from 'next/image'
import { redirect } from 'next/navigation'
import { auth, authProviders } from '@/auth'
import LoginForm from './login-form'

export const dynamic = 'force-dynamic'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const session = await auth()
  if (session?.user) redirect('/dashboard')
  const { error } = await searchParams

  return (
    <main className="grid min-h-screen bg-[#f7f7f3] lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden bg-[#0b2c47] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -left-36 top-20 size-[420px] rounded-full bg-[#48d2dc]/20 blur-[100px]" />
        <div className="absolute -right-20 bottom-10 size-[360px] rounded-full bg-[#ff6b4d]/20 blur-[90px]" />
        <a href="/" className="relative z-10">
          <Image
            src="/masidy-logo.png"
            alt="Masidy"
            width={959}
            height={313}
            className="h-14 w-auto rounded-lg bg-white px-2 py-1"
          />
        </a>
        <div className="relative z-10 max-w-xl">
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#6ddbe2]">
            One account. Every side of travel.
          </p>
          <h1 className="mt-5 text-6xl font-semibold leading-[.95] tracking-[-.065em]">
            Your travel business, connected.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-white/65">
            Discover, sell, fulfill and manage journeys from one intelligent workspace built for
            travelers, agents and agencies.
          </p>
        </div>
        <div className="relative z-10 grid grid-cols-3 gap-3">
          {[
            ['Travelers', 'Book with confidence'],
            ['Agents', 'Sell and earn'],
            ['Agencies', 'Operate at scale'],
          ].map(([title, text]) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/[.06] p-4">
              <p className="text-sm font-extrabold">{title}</p>
              <p className="mt-1 text-xs text-white/50">{text}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="flex items-center justify-center px-5 py-16 sm:px-8">
        <div className="w-full max-w-md">
          <a href="/" className="mb-10 inline-block lg:hidden">
            <Image
              src="/masidy-logo.png"
              alt="Masidy"
              width={959}
              height={313}
              className="h-12 w-auto"
            />
          </a>
          <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#0c8da8]">
            Welcome to Masidy
          </p>
          <h2 className="mt-3 text-4xl font-black tracking-[-.055em] text-[#0b2944]">
            Sign in to your workspace.
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Continue securely with your Google account.
          </p>
          <div className="mt-8">
            <LoginForm googleEnabled={authProviders.google} authError={Boolean(error)} />
          </div>
          <p className="mt-8 text-center text-xs leading-5 text-slate-400">
            By continuing, you agree to secure account processing and Masidy&apos;s marketplace
            standards.
          </p>
        </div>
      </section>
    </main>
  )
}
