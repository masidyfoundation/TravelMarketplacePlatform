import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  Bot,
  Building2,
  ChartNoAxesCombined,
  CreditCard,
  Heart,
  Globe2,
  LayoutDashboard,
  Map,
  Settings,
  ShieldCheck,
  MessageCircle,
  ShoppingBag,
  Users,
} from 'lucide-react'
import { getCurrentUser } from '@/lib/current-user'
import { hasRequiredConsents } from '@/lib/required-consents'
import SignOutButton from './sign-out-button'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!(await hasRequiredConsents(user))) redirect('/consent')

  const nav = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    user.role === 'agency'
      ? { label: 'Inventory', href: '/dashboard/inventory', icon: ShoppingBag }
      : user.role === 'agent'
        ? { label: 'Storefront', href: '/dashboard/storefront', icon: ShoppingBag }
        : { label: 'My journeys', href: '/dashboard#records', icon: Map },
    { label: 'Saved journeys', href: '/dashboard/saved', icon: Heart },
    { label: 'Travel desk', href: '/dashboard/operations', icon: MessageCircle },
    { label: 'Masidy Make', href: '/studio', icon: Bot },
    { label: 'Payments', href: '/dashboard/finance', icon: CreditCard },
    {
      label: user.role === 'agency' ? 'Team' : 'Network',
      href: '/dashboard#network',
      icon: user.role === 'agency' ? Users : ChartNoAxesCombined,
    },
    { label: 'Partner verification', href: '/onboarding', icon: Settings },
    { label: 'Privacy', href: '/dashboard/privacy', icon: ShieldCheck },
    { label: 'Preferences', href: '/dashboard/preferences', icon: Globe2 },
  ]

  return (
    <div className="min-h-screen bg-[#f5f7f7] text-[#0b2944]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-white p-5 lg:flex lg:flex-col">
        <Link href="/">
          <Image
            src="/masidy-logo.png"
            alt="Masidy"
            width={959}
            height={313}
            className="h-11 w-auto"
          />
        </Link>
        <div className="mt-9 flex-1 space-y-1">
          {nav.map((item, index) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                index === 0
                  ? 'bg-[#eaf7f9] text-[#087f9e]'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </div>
        <div className="border-t border-slate-100 pt-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <span className="grid size-9 place-items-center rounded-full bg-[#ff674c] text-xs font-black text-white">
              {user.name.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold">{user.name}</p>
              <p className="truncate text-[11px] capitalize text-slate-400">
                {user.role} workspace
              </p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur lg:hidden">
        <Link href="/">
          <Image
            src="/masidy-logo.png"
            alt="Masidy"
            width={959}
            height={313}
            className="h-9 w-auto"
          />
        </Link>
        <Link
          href="/studio"
          className="rounded-full bg-[#0b2f4c] px-4 py-2 text-xs font-extrabold text-white"
        >
          Masidy Make
        </Link>
      </header>
      <div className="lg:pl-64">
        <div className="mx-auto max-w-[1380px] p-5 sm:p-8 lg:p-10">{children}</div>
      </div>
    </div>
  )
}
