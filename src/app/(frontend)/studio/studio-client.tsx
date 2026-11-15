'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Bot,
  FileText,
  LayoutTemplate,
  LoaderCircle,
  Megaphone,
  Route,
  Sparkles,
} from 'lucide-react'
import { useActionState, useEffect } from 'react'
import { createBrandKit, generateProject, initialStudioState } from './actions'

type Project = {
  id: string
  title: string
  type: string
  status: string
  updatedAt: string
}

const projectTypes = [
  { value: 'landing-page', label: 'Landing page', icon: LayoutTemplate },
  { value: 'campaign', label: 'Campaign', icon: Megaphone },
  { value: 'itinerary', label: 'Itinerary', icon: Route },
  { value: 'social', label: 'Social content', icon: FileText },
  { value: 'inventory-enrichment', label: 'Inventory enrichment', icon: Sparkles },
  { value: 'pricing-intelligence', label: 'Pricing intelligence', icon: Sparkles },
  { value: 'trip-matching', label: 'Trip matching', icon: Route },
  { value: 'proposal', label: 'Client proposal', icon: FileText },
  { value: 'support-assistant', label: 'Support assistant', icon: Bot },
]

const roleToolkits = {
  traveler: ['Trip architecture', 'Budget optimization', 'Visa readiness', 'Packing intelligence'],
  agent: ['Client matching', 'Proposal generation', 'Storefront content', 'Commission forecasting'],
  agency: [
    'Inventory enrichment',
    'Pricing intelligence',
    'Campaign production',
    'Operations summaries',
  ],
}

export default function StudioClient({
  projects,
  configured,
  role,
  brandKits,
}: {
  projects: Project[]
  configured: boolean
  role: 'traveler' | 'agent' | 'agency'
  brandKits: Array<{ id: string; name: string }>
}) {
  const [state, formAction, pending] = useActionState(generateProject, initialStudioState)
  const [brandState, brandAction, brandPending] = useActionState(createBrandKit, initialStudioState)
  const router = useRouter()

  useEffect(() => {
    if (state.status === 'success') router.refresh()
  }, [router, state.status])

  return (
    <main className="min-h-screen bg-[#071d2f] text-white">
      <header className="border-b border-white/10 px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="grid size-10 place-items-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/15 hover:text-white"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#69dbe2]">
                Masidy Make
              </p>
              <h1 className="text-lg font-black">AI creation workspace</h1>
            </div>
          </div>
          <span
            className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${
              configured ? 'bg-emerald-400/15 text-emerald-300' : 'bg-amber-400/15 text-amber-300'
            }`}
          >
            {configured ? 'AI connected' : 'Waiting for AI key'}
          </span>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1480px] gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[330px_1fr]">
        <aside className="rounded-[28px] border border-white/10 bg-white/[.045] p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#5dd4dd]/15 text-[#69dbe2]">
              <Bot size={21} />
            </span>
            <div>
              <h2 className="text-sm font-extrabold">Your projects</h2>
              <p className="text-xs text-white/40">{projects.length} saved</p>
            </div>
          </div>
          <div className="mt-5 space-y-2">
            {projects.length > 0 ? (
              projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/studio/projects/${project.id}`}
                  className="rounded-2xl border border-white/8 bg-white/[.04] p-4"
                >
                  <p className="truncate text-sm font-extrabold">{project.title}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="capitalize text-white/40">
                      {project.type.replace('-', ' ')}
                    </span>
                    <span className="rounded-full bg-emerald-400/10 px-2 py-1 capitalize text-emerald-300">
                      {project.status}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center">
                <Sparkles className="mx-auto text-white/20" size={26} />
                <p className="mt-3 text-xs leading-5 text-white/40">
                  Your generated work will stay organized here.
                </p>
              </div>
            )}
          </div>
          <form action={brandAction} className="mt-6 border-t border-white/10 pt-5">
            <p className="text-xs font-extrabold text-white/60">New brand kit</p>
            <input
              name="name"
              required
              placeholder="Brand name"
              className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs"
            />
            <textarea
              name="tone"
              required
              minLength={10}
              placeholder="Voice and tone"
              className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs"
            />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <input
                name="primaryColor"
                type="color"
                defaultValue="#0b2e4a"
                className="h-10 w-full rounded-lg bg-transparent"
              />
              <input
                name="accentColor"
                type="color"
                defaultValue="#ff654c"
                className="h-10 w-full rounded-lg bg-transparent"
              />
            </div>
            <button
              disabled={brandPending}
              className="mt-3 w-full rounded-xl bg-white/10 px-3 py-2.5 text-xs font-extrabold"
            >
              {brandPending ? 'Saving...' : 'Save brand kit'}
            </button>
            {brandState.status !== 'idle' && (
              <p className="mt-2 text-[11px] text-white/50">{brandState.message}</p>
            )}
          </form>
        </aside>

        <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#0b2943] p-5 sm:p-8 lg:p-10">
          <div className="absolute -right-32 -top-32 size-[420px] rounded-full bg-[#49ced8]/10 blur-[90px]" />
          <div className="relative z-10 max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/8 px-3 py-1.5 text-xs font-extrabold text-[#74dfe5]">
              <Sparkles size={14} />
              Create from a clear idea
            </span>
            <h2 className="mt-5 text-4xl font-black tracking-[-.055em] sm:text-5xl">
              What are we making today?
            </h2>
            <p className="mt-4 max-w-2xl leading-7 text-white/55">
              Turn a brief into structured page copy, campaigns, travel itineraries or social
              concepts—saved directly to your Masidy workspace.
            </p>
          </div>

          <form action={formAction} className="relative z-10 mt-10 space-y-5">
            <div>
              <span className="mb-3 block text-xs font-extrabold text-white/60">
                Recommended for your {role} workspace
              </span>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {roleToolkits[role].map((tool) => (
                  <div
                    key={tool}
                    className="rounded-xl border border-white/10 bg-white/[.045] px-3 py-3 text-xs font-extrabold text-white/65"
                  >
                    {tool}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-5 md:grid-cols-[1fr_1.2fr]">
              <label className="block">
                <span className="mb-2 block text-xs font-extrabold text-white/60">
                  Project title
                </span>
                <input
                  name="title"
                  required
                  placeholder="Autumn in Kyoto campaign"
                  className="w-full rounded-2xl border border-white/10 bg-white/[.06] px-4 py-3.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#5ed4dc]"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-extrabold text-white/60">Output type</span>
                <select
                  name="type"
                  className="w-full rounded-2xl border border-white/10 bg-[#123450] px-4 py-3.5 text-sm text-white outline-none focus:border-[#5ed4dc]"
                >
                  {projectTypes.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-extrabold text-white/60">
                  Page template
                </span>
                <select
                  name="template"
                  className="w-full rounded-2xl border border-white/10 bg-[#123450] px-4 py-3.5 text-sm text-white"
                >
                  {['editorial', 'immersive', 'minimal', 'campaign'].map((template) => (
                    <option key={template} value={template}>
                      {template}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-extrabold text-white/60">Brand kit</span>
                <select
                  name="brandKit"
                  className="w-full rounded-2xl border border-white/10 bg-[#123450] px-4 py-3.5 text-sm text-white"
                >
                  <option value="">Masidy default</option>
                  {brandKits.map((kit) => (
                    <option key={kit.id} value={kit.id}>
                      {kit.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block">
              <span className="mb-2 block text-xs font-extrabold text-white/60">
                Describe the goal, audience and feeling
              </span>
              <textarea
                name="prompt"
                required
                rows={8}
                placeholder="Create a premium landing page for a seven-day Kyoto cultural journey aimed at design-conscious couples. Focus on small-group access, craft, food and quiet luxury..."
                className="w-full resize-none rounded-[22px] border border-white/10 bg-white/[.06] px-5 py-4 text-sm leading-7 text-white outline-none placeholder:text-white/25 focus:border-[#5ed4dc]"
              />
            </label>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-xl text-xs leading-5 text-white/35">
                Generated output is saved as an editable project. Review facts, pricing and legal
                claims before publishing.
              </p>
              <button
                type="submit"
                disabled={pending}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#ff654b] px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-[#ff654b]/15 disabled:opacity-60"
              >
                {pending ? (
                  <>
                    <LoaderCircle size={17} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={17} />
                    Generate project
                  </>
                )}
              </button>
            </div>
          </form>

          {state.status !== 'idle' && (
            <div
              className={`relative z-10 mt-7 rounded-[24px] border p-5 ${
                state.status === 'success'
                  ? 'border-emerald-300/20 bg-emerald-300/8'
                  : 'border-amber-300/20 bg-amber-300/8'
              }`}
            >
              <p className="text-sm font-extrabold">{state.message}</p>
              {state.output && (
                <div className="mt-4 max-h-[420px] overflow-y-auto whitespace-pre-wrap rounded-2xl bg-black/15 p-5 text-sm leading-7 text-white/75">
                  {state.output}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
