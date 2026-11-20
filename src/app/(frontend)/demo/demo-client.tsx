'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  Building2,
  CalendarCheck,
  ChartNoAxesCombined,
  Check,
  ChevronRight,
  CircleDollarSign,
  Compass,
  CreditCard,
  FileChartColumn,
  Globe2,
  LayoutDashboard,
  LineChart,
  MapPinned,
  Menu,
  MessageSquareText,
  PackageCheck,
  Plane,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingUp,
  Users,
  WandSparkles,
  X,
  Zap,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import type { PublicAgency, PublicTrip } from '@/lib/marketplace-data'

type Role = 'traveler' | 'agent' | 'agency'

const roleConfig = {
  traveler: {
    label: 'Traveler',
    subtitle: 'Plan, book and manage every journey',
    headline: 'Your whole world of travel, under control.',
    accent: '#11a1b5',
    metrics: [
      ['Upcoming journeys', '3', MapPinned],
      ['Saved experiences', '18', Compass],
      ['Travel credits', '$420', CreditCard],
      ['Readiness score', '92%', ShieldCheck],
    ],
    tools: [
      [
        'AI Trip Architect',
        'Build a complete trip around your budget, pace and interests.',
        WandSparkles,
      ],
      [
        'Smart Fare Watch',
        'Monitor package and route changes, then alert you at the right moment.',
        TrendingUp,
      ],
      [
        'Visa & Readiness',
        'Turn destination requirements into one personalized checklist.',
        ShieldCheck,
      ],
      [
        'Live Travel Concierge',
        'Get context-aware help before, during and after your journey.',
        MessageSquareText,
      ],
    ],
  },
  agent: {
    label: 'Travel agent',
    subtitle: 'Curate, sell and earn with confidence',
    headline: 'Your influence becomes a travel business.',
    accent: '#7663d3',
    metrics: [
      ['Commission this month', '$4,860', CircleDollarSign],
      ['Active proposals', '12', FileChartColumn],
      ['Conversion rate', '8.4%', LineChart],
      ['Client pipeline', '47', Users],
    ],
    tools: [
      [
        'AI Storefront Builder',
        'Create a conversion-ready travel storefront from your selected inventory.',
        Store,
      ],
      ['Client Match Engine', 'Rank trips against budget, preferences and booking intent.', Search],
      [
        'Proposal Generator',
        'Create polished, personalized proposals in seconds.',
        FileChartColumn,
      ],
      [
        'Commission Forecaster',
        'Model earnings, conversion and payout timing before you sell.',
        ChartNoAxesCombined,
      ],
    ],
  },
  agency: {
    label: 'Travel agency',
    subtitle: 'Operate inventory, teams and revenue at scale',
    headline: 'One command center for the whole operation.',
    accent: '#f16547',
    metrics: [
      ['Gross booking value', '$184K', CircleDollarSign],
      ['Live packages', '64', PackageCheck],
      ['Partner agents', '238', Users],
      ['Fulfillment score', '97.8%', BadgeCheck],
    ],
    tools: [
      [
        'Inventory Copilot',
        'Create, normalize and enrich travel products from supplier information.',
        PackageCheck,
      ],
      [
        'Pricing Intelligence',
        'Model demand, margin and channel commission before publishing.',
        LineChart,
      ],
      [
        'Campaign Studio',
        'Generate launch pages, emails and agent enablement from one brief.',
        Sparkles,
      ],
      [
        'Operations Assistant',
        'Summarize demand, exceptions and next actions across every booking.',
        Zap,
      ],
    ],
  },
} satisfies Record<Role, unknown>

const demoActivity = {
  traveler: [
    ['Kyoto in Quiet Detail', 'Trip confirmed', 'Oct 14–21'],
    ['Aegean Light', 'Saved journey', 'Flexible'],
    ['Maldives, Beyond the Blue', 'Quote updated', 'Dec 2–9'],
  ],
  agent: [
    ['Amira & Samir', 'Proposal viewed', '$6,240'],
    ['The Chen family', 'Checkout started', '$9,780'],
    ['Nora A.', 'New trip match', '$3,120'],
  ],
  agency: [
    ['Maldives, Beyond the Blue', '7 new requests', '$27,230'],
    ['Kyoto in Quiet Detail', 'Agent inventory sync', '18 sellers'],
    ['Aegean Light', 'Payment cleared', '$6,240'],
  ],
}

export default function DemoClient({
  trips,
  agencies,
}: {
  trips: PublicTrip[]
  agencies: PublicAgency[]
}) {
  const [role, setRole] = useState<Role>('traveler')
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeTool, setActiveTool] = useState(0)
  const [generated, setGenerated] = useState(false)
  const config = roleConfig[role] as {
    label: string
    subtitle: string
    headline: string
    accent: string
    metrics: Array<[string, string, typeof MapPinned]>
    tools: Array<[string, string, typeof MapPinned]>
  }

  const roleTrips = useMemo(() => (role === 'agency' ? trips : trips.slice(0, 3)), [role, trips])

  const changeRole = (next: Role) => {
    setRole(next)
    setActiveTool(0)
    setGenerated(false)
  }

  return (
    <div className="min-h-screen bg-[#f4f7f7] text-[#0b2944]">
      <div className="bg-[#0b2e4a] px-4 py-2.5 text-center text-xs font-bold text-white">
        <span className="text-[#69dce3]">Guest demo</span>
        <span className="mx-2 text-white/25">•</span>
        Explore every workflow safely. Demo actions never modify live records.
      </div>

      <aside className="fixed bottom-0 left-0 top-[37px] z-30 hidden w-64 border-r border-slate-200 bg-white p-5 lg:flex lg:flex-col">
        <Link href="/">
          <Image
            src="/masidy-logo.png"
            alt="Masidy"
            width={959}
            height={313}
            className="h-11 w-auto"
          />
        </Link>
        <div className="mt-8 rounded-2xl bg-[#f2f7f8] p-3">
          <p className="px-2 text-[10px] font-extrabold uppercase tracking-[.14em] text-slate-400">
            Viewing as
          </p>
          <div className="mt-2 space-y-1">
            {(
              [
                ['traveler', Compass],
                ['agent', Users],
                ['agency', Building2],
              ] as const
            ).map(([value, Icon]) => (
              <button
                key={value}
                type="button"
                onClick={() => changeRole(value)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-extrabold transition ${
                  role === value
                    ? 'bg-white text-[#0b819d] shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon size={17} />
                {roleConfig[value].label}
              </button>
            ))}
          </div>
        </div>
        <nav className="mt-6 flex-1 space-y-1">
          {[
            ['Overview', LayoutDashboard],
            [role === 'traveler' ? 'My journeys' : 'Marketplace', Plane],
            ['Masidy Make AI', Bot],
            ['Payments', CreditCard],
            [role === 'agency' ? 'Team & agents' : 'Network', Users],
            ['Automation', Zap],
          ].map(([label, Icon], index) => {
            const NavIcon = Icon as typeof LayoutDashboard
            return (
              <a
                key={String(label)}
                href={index === 2 ? '#ai-lab' : index === 1 ? '#workspace' : '#top'}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                  index === 0
                    ? 'bg-[#e9f7f9] text-[#087f9c]'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <NavIcon size={17} />
                {String(label)}
              </a>
            )
          })}
        </nav>
        <Link
          href="/login"
          className="flex items-center justify-center gap-2 rounded-full bg-[#ff6248] px-5 py-3 text-sm font-extrabold text-white"
        >
          Create free account <ArrowRight size={16} />
        </Link>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/92 px-5 py-4 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="grid size-10 place-items-center rounded-full bg-slate-100 lg:hidden"
              aria-label="Toggle demo roles"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-slate-400">
                {config.label} workspace
              </p>
              <p className="text-sm font-extrabold">{config.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="hidden text-xs font-extrabold text-slate-500 sm:block">
              Back to marketplace
            </Link>
            <span className="grid size-10 place-items-center rounded-full bg-[#0b2e4a] text-xs font-black text-white">
              GT
            </span>
          </div>
        </header>

        {menuOpen && (
          <div className="fixed inset-x-4 top-[102px] z-40 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl lg:hidden">
            {(['traveler', 'agent', 'agency'] as Role[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  changeRole(value)
                  setMenuOpen(false)
                }}
                className={`w-full rounded-xl px-4 py-3 text-left text-sm font-extrabold ${
                  role === value ? 'bg-[#eaf7f9] text-[#0b829e]' : 'text-slate-600'
                }`}
              >
                {roleConfig[value].label}
              </button>
            ))}
          </div>
        )}

        <main id="top" className="mx-auto max-w-[1500px] p-5 sm:p-8">
          <section className="relative overflow-hidden rounded-[34px] bg-[#0b2e4a] px-6 py-10 text-white sm:px-10 lg:px-12">
            <div
              className="absolute -right-24 -top-28 size-[380px] rounded-full blur-[90px]"
              style={{ backgroundColor: `${config.accent}33` }}
            />
            <div className="relative z-10 flex flex-col justify-between gap-8 xl:flex-row xl:items-end">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-extrabold text-[#75dfe5]">
                  <Sparkles size={14} />
                  Powered by Masidy intelligence
                </span>
                <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[.98] tracking-[-.06em] sm:text-5xl lg:text-6xl">
                  {config.headline}
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/55 sm:text-base">
                  This interactive guest workspace uses live marketplace inventory with safe demo
                  operations and role-specific AI tools.
                </p>
              </div>
              <a
                href="#ai-lab"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-extrabold text-[#0b2e4a]"
              >
                Open AI command center <ArrowRight size={16} />
              </a>
            </div>
          </section>

          <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {config.metrics.map(([label, value, Icon]) => (
              <article
                key={label}
                className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="grid size-10 place-items-center rounded-xl"
                    style={{ backgroundColor: `${config.accent}16`, color: config.accent }}
                  >
                    <Icon size={19} />
                  </span>
                  <span className="text-[10px] font-extrabold uppercase tracking-[.1em] text-emerald-600">
                    Live
                  </span>
                </div>
                <p className="mt-5 text-3xl font-black tracking-[-.045em]">{value}</p>
                <p className="mt-1 text-xs font-bold text-slate-400">{label}</p>
              </article>
            ))}
          </section>

          <section id="workspace" className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_.7fr]">
            <div className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-slate-400">
                    {role === 'traveler'
                      ? 'Journey workspace'
                      : role === 'agent'
                        ? 'Sales pipeline'
                        : 'Inventory performance'}
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-[-.04em]">
                    What needs attention
                  </h2>
                </div>
                <button className="rounded-full bg-slate-100 px-4 py-2 text-xs font-extrabold text-slate-500">
                  View all
                </button>
              </div>
              <div className="mt-5 divide-y divide-slate-100">
                {demoActivity[role].map(([name, status, meta], index) => (
                  <div key={name} className="flex items-center gap-3 py-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#eaf7f9] text-[#0b8da7]">
                      {role === 'traveler' ? (
                        <Plane size={19} />
                      ) : role === 'agent' ? (
                        <Users size={19} />
                      ) : (
                        <PackageCheck size={19} />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold">{name}</p>
                      <p className="mt-1 text-xs text-slate-400">{status}</p>
                    </div>
                    <p className="hidden text-xs font-extrabold text-slate-500 sm:block">{meta}</p>
                    <span className="grid size-8 place-items-center rounded-full bg-slate-50 text-slate-400">
                      <ChevronRight size={15} />
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
              <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-slate-400">
                Automated today
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-[-.04em]">System pulse</h2>
              <div className="mt-5 space-y-3">
                {[
                  [
                    'Inventory synced',
                    role === 'agency' ? `${trips.length} live packages` : 'Just now',
                  ],
                  ['Payments reconciled', '100% matched'],
                  ['Risk checks', 'No exceptions'],
                  ['AI actions', '12 completed'],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-2xl bg-[#f6f8f8] p-3.5"
                  >
                    <span className="flex items-center gap-2 text-xs font-bold text-slate-600">
                      <Check size={14} className="text-emerald-600" />
                      {label}
                    </span>
                    <span className="text-[11px] font-extrabold text-slate-400">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section
            id="ai-lab"
            className="mt-5 overflow-hidden rounded-[32px] bg-[#091f33] text-white"
          >
            <div className="grid lg:grid-cols-[.9fr_1.1fr]">
              <div className="border-b border-white/10 p-6 sm:p-8 lg:border-b-0 lg:border-r">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#5bd4dd]/12 px-3 py-1.5 text-xs font-extrabold text-[#72dfe6]">
                  <Bot size={14} />
                  Masidy Make AI for {config.label.toLowerCase()}s
                </span>
                <h2 className="mt-5 text-4xl font-black tracking-[-.055em]">
                  Intelligence that understands your role.
                </h2>
                <p className="mt-4 text-sm leading-7 text-white/50">
                  Each copilot combines marketplace context, your workspace data and a purpose-built
                  workflow instead of returning generic chat.
                </p>
                <div className="mt-7 space-y-2">
                  {config.tools.map(([title, description, Icon], index) => (
                    <button
                      key={title}
                      type="button"
                      onClick={() => {
                        setActiveTool(index)
                        setGenerated(false)
                      }}
                      className={`flex w-full items-center gap-3 rounded-2xl p-3.5 text-left transition ${
                        activeTool === index ? 'bg-white/10' : 'hover:bg-white/[.05]'
                      }`}
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/8 text-[#6ddbe3]">
                        <Icon size={19} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-extrabold">{title}</span>
                        <span className="mt-1 block truncate text-xs text-white/35">
                          {description}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative p-6 sm:p-8">
                <div className="absolute -right-24 -top-24 size-72 rounded-full bg-[#6b5bd0]/15 blur-[80px]" />
                <div className="relative">
                  <p className="text-xs font-extrabold uppercase tracking-[.14em] text-white/35">
                    Active copilot
                  </p>
                  <h3 className="mt-3 text-3xl font-black tracking-[-.045em]">
                    {config.tools[activeTool][0]}
                  </h3>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-white/50">
                    {config.tools[activeTool][1]}
                  </p>
                  <div className="mt-7 rounded-[24px] border border-white/10 bg-white/[.05] p-4">
                    <textarea
                      rows={5}
                      defaultValue={
                        role === 'traveler'
                          ? 'Plan a calm 8-day Japan journey for two with craft, food and boutique stays under $6,000.'
                          : role === 'agent'
                            ? 'Create a premium proposal for a family of four seeking a winter sun escape with flexible cancellation.'
                            : 'Analyze our top four packages and create a 30-day agent activation campaign focused on conversion.'
                      }
                      className="w-full resize-none bg-transparent text-sm leading-7 text-white outline-none"
                    />
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setGenerated(true)}
                        className="inline-flex items-center gap-2 rounded-full bg-[#ff644a] px-5 py-2.5 text-xs font-extrabold text-white"
                      >
                        <Send size={14} />
                        Run demo copilot
                      </button>
                    </div>
                  </div>
                  {generated && (
                    <div className="mt-5 rounded-[24px] border border-emerald-300/15 bg-emerald-300/[.06] p-5">
                      <div className="flex items-center gap-2 text-sm font-extrabold text-emerald-300">
                        <Check size={16} />
                        Demo output ready
                      </div>
                      <p className="mt-3 text-sm leading-7 text-white/60">
                        I analyzed sample Masidy inventory and prepared a structured recommendation
                        with the best-fit journeys, pricing logic, next actions and a polished
                        customer-facing narrative. Connect the AI key to generate personalized
                        production output and save it to the workspace.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="mt-5 rounded-[30px] border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-slate-400">
                  Demo marketplace connection
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-.04em]">
                  {role === 'agency' ? 'Published inventory' : 'Recommended now'}
                </h2>
              </div>
              <p className="text-xs font-bold text-emerald-600">
                Using {agencies.length} clearly labeled sample agencies
              </p>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {roleTrips.slice(0, 4).map((trip) => (
                <article
                  key={trip.id}
                  className="overflow-hidden rounded-2xl border border-slate-100"
                >
                  <div className="relative h-36">
                    <Image
                      src={trip.image}
                      alt={trip.imageAlt}
                      fill
                      sizes="300px"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-[#0b8ba7]">
                      {trip.destination}
                    </p>
                    <h3 className="mt-2 truncate text-sm font-extrabold">{trip.title}</h3>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs font-black">${trip.price.toLocaleString()}</span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {role === 'agent' ? `${trip.commission}% commission` : `${trip.days} days`}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-5 flex flex-col items-start justify-between gap-6 rounded-[30px] bg-gradient-to-r from-[#ff694e] to-[#ed5142] p-7 text-white sm:p-9 lg:flex-row lg:items-center">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.16em] text-white/65">
                Ready to make it yours?
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-[-.045em]">
                Keep your work, data and AI projects.
              </h2>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-extrabold text-[#d94d3a]"
            >
              Create your Masidy account <ArrowRight size={16} />
            </Link>
          </section>
        </main>
      </div>
    </div>
  )
}
