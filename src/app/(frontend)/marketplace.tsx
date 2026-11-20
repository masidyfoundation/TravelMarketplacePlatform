'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  Check,
  CircleDollarSign,
  Compass,
  CreditCard,
  Headphones,
  Heart,
  MapPin,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Users,
  X,
} from 'lucide-react'
import { useActionState, useEffect, useMemo, useState } from 'react'
import { createBookingRequest, initialBookingState } from './actions'
import Turnstile from './turnstile'

export type MarketplaceTrip = {
  id: string
  slug: string
  title: string
  destination: string
  country: string
  category: string
  agencyName: string
  image: string
  imageAlt: string
  imageWidth: number
  imageHeight: number
  days: number
  price: number
  currency: string
  rating: number
  reviews: number
  commission: number
  tagline: string
  featured: boolean
}

export type MarketplaceAgency = {
  id: string
  slug: string
  name: string
  location: string
  specialty: string
  description: string
  rating: number
  reviews: number
  years: number
  image: string
  imageAlt: string
}

type MarketplaceProps = {
  trips: MarketplaceTrip[]
  agencies: MarketplaceAgency[]
  demoTrips: MarketplaceTrip[]
}

const categories = ['All', 'Beach', 'Culture', 'Adventure', 'Luxury']

const currency = (value: number, code: string) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: code,
    maximumFractionDigits: 0,
  }).format(value)

export default function Marketplace({ trips, agencies, demoTrips }: MarketplaceProps) {
  const [category, setCategory] = useState('All')
  const [query, setQuery] = useState('')
  const [savedTrips, setSavedTrips] = useState<string[]>([])
  const [savingTrips, setSavingTrips] = useState<string[]>([])
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState<MarketplaceTrip | null>(null)
  const [checkoutMessage, setCheckoutMessage] = useState('')
  const [checkoutBusy, setCheckoutBusy] = useState(false)
  const [state, formAction, pending] = useActionState(createBookingRequest, initialBookingState)

  const featuredLive = trips.find((trip) => trip.featured) ?? trips[0]
  const featuredDemo = demoTrips.find((trip) => trip.featured) ?? demoTrips[0]
  const featured = featuredLive ?? featuredDemo
  const featuredIsDemo = !featuredLive && Boolean(featuredDemo)
  const filteredTrips = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return trips.filter((trip) => {
      const inCategory =
        category === 'All' || trip.category.toLowerCase() === category.toLowerCase()
      const inSearch =
        !needle ||
        `${trip.title} ${trip.destination} ${trip.country} ${trip.agencyName}`
          .toLowerCase()
          .includes(needle)
      return inCategory && inSearch
    })
  }, [category, query, trips])

  useEffect(() => {
    if (state.status === 'success') {
      const timer = window.setTimeout(() => setSelectedTrip(null), 4200)
      return () => window.clearTimeout(timer)
    }
  }, [state.status])

  useEffect(() => {
    fetch('/api/saved-trips')
      .then(async (response) => {
        if (!response.ok) return { tripIDs: [] as string[] }
        return (await response.json()) as { tripIDs: string[] }
      })
      .then((result) => setSavedTrips(result.tripIDs))
      .catch(() => undefined)
  }, [])

  const runSearch = () => {
    document.querySelector('#journeys')?.scrollIntoView({ behavior: 'smooth' })
  }

  const startCheckout = async (trip: MarketplaceTrip) => {
    setCheckoutBusy(true)
    setCheckoutMessage('')
    try {
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tripId: trip.id, travelers: 1 }),
      })
      if (response.status === 401) {
        window.location.assign('/login')
        return
      }
      const result = (await response.json()) as { url?: string; error?: string }
      if (!response.ok || !result.url) {
        setCheckoutMessage(result.error || 'Checkout could not be started.')
        return
      }
      window.location.assign(result.url)
    } catch {
      setCheckoutMessage('Checkout could not be started.')
    } finally {
      setCheckoutBusy(false)
    }
  }

  const toggleSavedTrip = async (tripId: string) => {
    setSavingTrips((current) => [...current, tripId])
    try {
      const response = await fetch('/api/saved-trips', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tripId }),
      })
      if (response.status === 401) {
        window.location.assign('/login')
        return
      }
      const result = (await response.json()) as { saved?: boolean }
      if (response.ok && typeof result.saved === 'boolean') {
        setSavedTrips((current) =>
          result.saved
            ? Array.from(new Set([...current, tripId]))
            : current.filter((id) => id !== tripId),
        )
      }
    } finally {
      setSavingTrips((current) => current.filter((id) => id !== tripId))
    }
  }

  return (
    <main className="overflow-hidden bg-[#fbfaf7] text-[#0b2239]">
      <header className="fixed inset-x-0 top-0 z-50 px-4 pt-3 sm:px-6">
        <nav className="mx-auto flex max-w-[1380px] items-center justify-between rounded-[20px] border border-white/70 bg-white/88 px-4 py-3 shadow-[0_10px_40px_rgba(12,38,60,.08)] backdrop-blur-xl sm:px-6">
          <a href="#top" aria-label="Masidy home" className="shrink-0">
            <Image
              src="/masidy-logo.png"
              alt="Masidy, your travel partner"
              width={959}
              height={313}
              className="h-10 w-auto sm:h-11"
              priority
            />
          </a>
          <div className="hidden items-center gap-8 text-sm font-semibold text-slate-600 lg:flex">
            <a className="transition hover:text-[#087cb4]" href="#journeys">
              Explore
            </a>
            <a className="transition hover:text-[#087cb4]" href="#agencies">
              Agencies
            </a>
            <a className="transition hover:text-[#087cb4]" href="#agents">
              For agents
            </a>
            <a className="transition hover:text-[#087cb4]" href="#how">
              How it works
            </a>
            <a className="transition hover:text-[#087cb4]" href="/demo">
              Live demo
            </a>
          </div>
          <div className="hidden items-center gap-3 sm:flex">
            <a
              href="/login"
              className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Sign in
            </a>
            <a
              href="#journeys"
              className="rounded-full bg-[#0c2f4d] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#0c2f4d]/15 transition hover:-translate-y-0.5 hover:bg-[#123d61]"
            >
              Find a journey
            </a>
          </div>
          <button
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="grid size-10 place-items-center rounded-full bg-slate-100 lg:hidden"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>
        {menuOpen && (
          <div className="mx-auto mt-2 flex max-w-[1380px] flex-col gap-1 rounded-2xl border border-slate-100 bg-white p-3 text-sm font-bold shadow-xl lg:hidden">
            {[
              ['Explore', '#journeys'],
              ['Agencies', '#agencies'],
              ['For agents', '#agents'],
              ['How it works', '#how'],
              ['Live demo', '/demo'],
              ['Sign in', '/login'],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-4 py-3 hover:bg-slate-50"
              >
                {label}
              </a>
            ))}
          </div>
        )}
      </header>

      <section
        id="top"
        className="relative min-h-[860px] overflow-hidden px-5 pb-20 pt-32 sm:px-8 lg:pt-40"
      >
        <div className="absolute -left-40 top-32 size-[440px] rounded-full bg-[#55d0df]/20 blur-[100px]" />
        <div className="absolute -right-32 top-0 size-[520px] rounded-full bg-[#ff7548]/17 blur-[110px]" />
        <div className="mx-auto grid max-w-[1320px] items-center gap-14 lg:grid-cols-[1.02fr_.98fr]">
          <div className="relative z-10">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#1599c1]/15 bg-[#eafaff] px-4 py-2 text-xs font-extrabold uppercase tracking-[.16em] text-[#087da9]">
              <Sparkles size={15} />
              One network. Better travel.
            </div>
            <h1 className="max-w-[740px] text-[clamp(3.5rem,7.2vw,6.8rem)] font-semibold leading-[.91] tracking-[-.072em] text-[#0b2944]">
              Travel gets better{' '}
              <span className="font-serif font-normal italic tracking-[-.035em] text-[#fb5b42]">
                together.
              </span>
            </h1>
            <p className="mt-8 max-w-[620px] text-lg leading-8 text-slate-600 sm:text-xl">
              Discover remarkable trips from trusted agencies. Book with confidence, or share what
              you love and earn as a travel agent.
            </p>

            <div className="mt-10 rounded-[26px] border border-white bg-white p-3 shadow-[0_24px_80px_rgba(14,50,75,.13)]">
              <div className="grid items-center gap-2 md:grid-cols-[1.4fr_1fr_auto]">
                <label className="flex items-center gap-3 rounded-2xl px-4 py-3 hover:bg-slate-50">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#e8f8fb] text-[#0b8db7]">
                    <MapPin size={19} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[11px] font-extrabold uppercase tracking-[.13em] text-slate-400">
                      Where
                    </span>
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      onKeyDown={(event) => event.key === 'Enter' && runSearch()}
                      placeholder="Try Maldives"
                      className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none placeholder:text-slate-400"
                    />
                  </span>
                </label>
                <label className="flex items-center gap-3 rounded-2xl px-4 py-3 hover:bg-slate-50">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#fff0e9] text-[#f2633d]">
                    <Compass size={19} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-extrabold uppercase tracking-[.13em] text-slate-400">
                      Style
                    </span>
                    <select
                      value={category}
                      onChange={(event) => setCategory(event.target.value)}
                      className="w-full cursor-pointer appearance-none bg-transparent text-sm font-bold text-slate-700 outline-none"
                    >
                      {categories.map((item) => (
                        <option key={item} value={item}>
                          {item === 'All' ? 'Any style' : item}
                        </option>
                      ))}
                    </select>
                  </span>
                </label>
                <button
                  type="button"
                  onClick={runSearch}
                  className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#ff6047] px-7 text-sm font-extrabold text-white shadow-lg shadow-[#ff6047]/20 transition hover:-translate-y-0.5 hover:bg-[#ef533b]"
                >
                  <Search size={18} />
                  Search
                </button>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm font-semibold text-slate-500">
              <span className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#11a6a0]" />
                {trips.length > 0 ? 'Verified agencies' : 'Demo content clearly marked'}
              </span>
              <span className="flex items-center gap-2">
                <Headphones size={18} className="text-[#11a6a0]" />
                Human support
              </span>
              <span className="flex items-center gap-2">
                <BadgeCheck size={18} className="text-[#11a6a0]" />
                Protected bookings
              </span>
            </div>
          </div>

          {featured && (
            <div className="relative mx-auto w-full max-w-[650px] lg:mx-0">
              <div className="relative ml-auto h-[580px] w-[90%] overflow-hidden rounded-[54px] shadow-[0_35px_110px_rgba(14,44,68,.22)] sm:h-[650px]">
                <Image
                  src={featured.image}
                  alt={featured.imageAlt}
                  fill
                  sizes="(max-width: 1024px) 90vw, 44vw"
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#08223b]/80 via-transparent to-transparent" />
                {featuredIsDemo && (
                  <span className="absolute left-6 top-6 rounded-full border border-white/30 bg-[#08233a]/75 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[.14em] text-white backdrop-blur">
                    Demo experience · not bookable
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 p-7 text-white sm:p-10">
                  <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white/80">
                    <MapPin size={16} />
                    {featured.destination}, {featured.country}
                  </div>
                  <h2 className="max-w-[440px] text-3xl font-semibold tracking-[-.04em] sm:text-4xl">
                    {featured.title}
                  </h2>
                  <div className="mt-6 flex items-end justify-between gap-4">
                    <div>
                      <span className="block text-xs font-bold uppercase tracking-[.14em] text-white/60">
                        {featuredIsDemo ? 'Illustrative price' : 'From'}
                      </span>
                      <span className="text-2xl font-extrabold">
                        {currency(featured.price, featured.currency)}
                      </span>
                    </div>
                    {featuredIsDemo ? (
                      <Link
                        href="/demo"
                        className="grid size-14 place-items-center rounded-full bg-white text-[#0b2944] transition hover:scale-105"
                        aria-label="Explore the Masidy product demo"
                      >
                        <ArrowRight size={22} />
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedTrip(featured)}
                        className="grid size-14 place-items-center rounded-full bg-white text-[#0b2944] transition hover:scale-105"
                        aria-label={`Request ${featured.title}`}
                      >
                        <ArrowRight size={22} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="absolute -left-1 top-16 rounded-[24px] border border-white/70 bg-white/92 p-4 shadow-xl backdrop-blur-lg sm:-left-8">
                <div className="flex items-center gap-3">
                  <div className="grid size-11 place-items-center rounded-full bg-[#e9fbf8] text-[#12a08f]">
                    <BadgeCheck size={22} />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold">
                      {featuredIsDemo ? 'Sample journey' : 'Expertly vetted'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {featuredIsDemo ? 'For product demonstration' : 'By local specialists'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-5 right-0 flex items-center gap-3 rounded-[24px] bg-[#0c2f4d] p-4 pr-6 text-white shadow-2xl sm:right-8">
                <div className="flex -space-x-2">
                  {['A', 'M', 'K'].map((letter, index) => (
                    <span
                      key={letter}
                      className={`grid size-9 place-items-center rounded-full border-2 border-[#0c2f4d] text-xs font-black ${
                        ['bg-[#ff7455]', 'bg-[#51c9d8]', 'bg-[#f0bd55]'][index]
                      }`}
                    >
                      {letter}
                    </span>
                  ))}
                </div>
                <div>
                  <p className="text-sm font-extrabold">
                    {featuredIsDemo ? 'Preview only' : '24/7 care'}
                  </p>
                  <p className="text-xs text-white/60">
                    {featuredIsDemo ? 'No booking or payment' : 'Before, during & after'}
                  </p>
                </div>
              </div>
            </div>
          )}
          {!featured && (
            <div className="relative mx-auto w-full max-w-[650px] lg:mx-0">
              <div className="rounded-[44px] border border-white bg-white p-8 shadow-[0_35px_110px_rgba(14,44,68,.14)] sm:p-12">
                <span className="grid size-16 place-items-center rounded-2xl bg-[#e8f9fb] text-[#0b93ad]">
                  <Compass size={30} />
                </span>
                <p className="mt-10 text-xs font-extrabold uppercase tracking-[.16em] text-[#0b8da8]">
                  Provider onboarding in progress
                </p>
                <h2 className="mt-4 text-3xl font-semibold tracking-[-.045em] text-[#0b2944] sm:text-5xl">
                  Real partner inventory is coming online.
                </h2>
                <p className="mt-5 max-w-lg text-base leading-7 text-slate-500">
                  New journeys appear here automatically after Masidy verifies the provider,
                  licensing, support contacts and sales terms.
                </p>
                <Link
                  href="/demo"
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#0c2f4d] px-6 py-3.5 text-sm font-extrabold text-white"
                >
                  Explore how Masidy works <ArrowRight size={17} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <section id="journeys" className="bg-white px-5 py-24 sm:px-8 lg:py-32">
        <div className="mx-auto max-w-[1320px]">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <span className="eyebrow">
                {trips.length > 0 ? 'Curated for you' : 'Demo preview'}
              </span>
              <h2 className="section-title mt-4">
                {trips.length > 0 ? 'Remarkable journeys, ' : 'See the marketplace, '}
                <span className="font-serif font-normal italic text-[#168bad]">
                  {trips.length > 0 ? 'ready to go.' : 'before providers arrive.'}
                </span>
              </h2>
              {trips.length === 0 && (
                <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500">
                  The journeys below are illustrative demo records. They show how real provider
                  inventory will look, but they cannot be booked, saved, or purchased.
                </p>
              )}
            </div>
            {trips.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {categories.map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => setCategory(item)}
                    className={`rounded-full px-5 py-2.5 text-sm font-extrabold transition ${
                      category === item
                        ? 'bg-[#0c2f4d] text-white shadow-lg'
                        : 'bg-[#f4f6f7] text-slate-500 hover:bg-[#e9eef1]'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>

          {filteredTrips.length > 0 ? (
            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {filteredTrips.map((trip, index) => (
                <article
                  key={trip.id}
                  className={`group overflow-hidden rounded-[30px] border border-slate-100 bg-white shadow-[0_15px_50px_rgba(20,49,70,.08)] transition duration-500 hover:-translate-y-2 hover:shadow-[0_28px_70px_rgba(20,49,70,.14)] ${
                    index === 0 && filteredTrips.length === 3 ? 'xl:col-span-2' : ''
                  }`}
                >
                  <div className="relative h-[310px] overflow-hidden">
                    <Image
                      src={trip.image}
                      alt={trip.imageAlt}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                      className="object-cover transition duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#08233a]/35 to-transparent" />
                    <span className="absolute left-4 top-4 rounded-full bg-white/92 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[.1em] text-[#0b2944] backdrop-blur">
                      {trip.days} days
                    </span>
                    <button
                      type="button"
                      aria-pressed={savedTrips.includes(trip.id)}
                      disabled={savingTrips.includes(trip.id)}
                      onClick={() => toggleSavedTrip(trip.id)}
                      className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/92 text-slate-600 backdrop-blur transition hover:scale-105 hover:text-[#f35b49]"
                      aria-label={`Save ${trip.title}`}
                    >
                      <Heart
                        size={18}
                        className={
                          savedTrips.includes(trip.id) ? 'fill-[#f35b49] text-[#f35b49]' : ''
                        }
                      />
                    </button>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="flex min-w-0 items-center gap-1.5 truncate text-xs font-bold text-slate-500">
                        <MapPin size={14} className="text-[#13a2b2]" />
                        {trip.destination}
                      </p>
                      <p className="flex shrink-0 items-center gap-1 text-xs font-extrabold text-slate-700">
                        <Star size={14} className="fill-[#f4ba45] text-[#f4ba45]" />
                        {trip.rating}
                        <span className="font-medium text-slate-400">({trip.reviews})</span>
                      </p>
                    </div>
                    <h3 className="mt-3 text-xl font-extrabold tracking-[-.035em] text-[#0c2d48]">
                      <Link href={`/trips/${trip.slug}`} className="hover:text-[#0b8da8]">
                        {trip.title}
                      </Link>
                    </h3>
                    <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">{trip.tagline}</p>
                    <div className="mt-5 flex items-end justify-between border-t border-slate-100 pt-4">
                      <div>
                        <span className="block text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400">
                          from / person
                        </span>
                        <span className="text-lg font-black text-[#0b2944]">
                          {currency(trip.price, trip.currency)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedTrip(trip)}
                        className="rounded-full bg-[#edf8fa] px-4 py-2 text-xs font-extrabold text-[#0985a7] transition hover:bg-[#0c2f4d] hover:text-white"
                      >
                        View trip
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : trips.length === 0 && demoTrips.length > 0 ? (
            <>
              <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {demoTrips.slice(0, 4).map((trip) => (
                  <article
                    key={trip.id}
                    className="group overflow-hidden rounded-[30px] border border-[#18a1b5]/20 bg-white shadow-[0_15px_50px_rgba(20,49,70,.08)]"
                  >
                    <div className="relative h-[300px] overflow-hidden">
                      <Image
                        src={trip.image}
                        alt={trip.imageAlt}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                        className="object-cover transition duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#08233a]/45 to-transparent" />
                      <span className="absolute left-4 top-4 rounded-full bg-[#0b2e4a] px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[.13em] text-white">
                        Demo · not bookable
                      </span>
                      <span className="absolute bottom-4 left-4 rounded-full bg-white/92 px-3 py-1.5 text-[11px] font-extrabold text-[#0b2944] backdrop-blur">
                        {trip.days} days
                      </span>
                    </div>
                    <div className="p-5">
                      <p className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <MapPin size={14} className="text-[#13a2b2]" />
                        {trip.destination}, {trip.country}
                      </p>
                      <h3 className="mt-3 text-xl font-extrabold tracking-[-.035em] text-[#0c2d48]">
                        {trip.title}
                      </h3>
                      <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
                        {trip.tagline}
                      </p>
                      <div className="mt-5 flex items-end justify-between border-t border-slate-100 pt-4">
                        <div>
                          <span className="block text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400">
                            Example price
                          </span>
                          <span className="text-lg font-black text-[#0b2944]">
                            {currency(trip.price, trip.currency)}
                          </span>
                        </div>
                        <Link
                          href="/demo"
                          className="rounded-full bg-[#edf8fa] px-4 py-2 text-xs font-extrabold text-[#0985a7]"
                        >
                          Explore demo
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-[24px] bg-[#edf9fa] p-5 sm:flex-row sm:items-center">
                <p className="text-sm font-bold leading-6 text-[#0b5265]">
                  Demo trips are sample content only. Real trips will appear automatically after
                  provider verification and cannot be confused with these previews.
                </p>
                <Link
                  href="/demo"
                  className="shrink-0 rounded-full bg-[#0b2e4a] px-5 py-2.5 text-xs font-extrabold text-white"
                >
                  Open interactive demo
                </Link>
              </div>
            </>
          ) : (
            <div className="mt-12 rounded-[30px] border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center">
              <Compass className="mx-auto text-slate-300" size={36} />
              <h3 className="mt-4 text-xl font-extrabold">
                {trips.length === 0 ? 'Live journeys are being onboarded' : 'No exact match yet'}
              </h3>
              <p className="mt-2 text-slate-500">
                {trips.length === 0
                  ? 'Only verified providers with complete sales information can publish here.'
                  : 'Try another destination or browse all journeys.'}
              </p>
              {trips.length === 0 ? (
                <Link
                  href="/demo"
                  className="mt-5 inline-flex rounded-full bg-[#0c2f4d] px-5 py-2.5 text-sm font-bold text-white"
                >
                  View the product demo
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('')
                    setCategory('All')
                  }}
                  className="mt-5 rounded-full bg-[#0c2f4d] px-5 py-2.5 text-sm font-bold text-white"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      <section id="how" className="px-5 py-24 sm:px-8 lg:py-32">
        <div className="mx-auto max-w-[1320px]">
          <div className="mx-auto max-w-3xl text-center">
            <span className="eyebrow">Built for the whole travel economy</span>
            <h2 className="section-title mt-4">
              One place.{' '}
              <span className="font-serif font-normal italic text-[#fb5b42]">Everyone wins.</span>
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-500">
              Masidy brings trusted supply, inspired sellers and curious travelers into one
              transparent network.
            </p>
          </div>
          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {[
              {
                icon: Compass,
                overline: 'For travelers',
                title: 'Find trips worth taking',
                copy: 'Compare distinctive journeys, know who created them and book with a real human behind every detail.',
                color: 'bg-[#e8f9fb] text-[#0b93ad]',
                number: '01',
              },
              {
                icon: Store,
                overline: 'For agencies',
                title: 'Reach beyond your storefront',
                copy: 'Publish your best inventory once and let a trusted network of agents bring it to the right audience.',
                color: 'bg-[#fff0e9] text-[#ef6944]',
                number: '02',
              },
              {
                icon: Users,
                overline: 'For agents',
                title: 'Turn influence into income',
                copy: 'Curate agency-backed trips, share your storefront and earn clear commission on every confirmed booking.',
                color: 'bg-[#eef0ff] text-[#5d68ca]',
                number: '03',
              },
            ].map((item) => (
              <article
                key={item.title}
                className="relative overflow-hidden rounded-[34px] border border-white bg-white p-8 shadow-[0_15px_50px_rgba(20,49,70,.07)] sm:p-10"
              >
                <span className="absolute right-7 top-5 text-6xl font-black tracking-tighter text-slate-100">
                  {item.number}
                </span>
                <span className={`grid size-14 place-items-center rounded-2xl ${item.color}`}>
                  <item.icon size={25} />
                </span>
                <p className="mt-8 text-xs font-extrabold uppercase tracking-[.16em] text-slate-400">
                  {item.overline}
                </p>
                <h3 className="mt-3 text-2xl font-extrabold tracking-[-.04em]">{item.title}</h3>
                <p className="mt-4 leading-7 text-slate-500">{item.copy}</p>
                <a
                  href={item.overline === 'For agents' ? '#agents' : '#journeys'}
                  className="mt-7 inline-flex items-center gap-2 text-sm font-extrabold text-[#0b87aa]"
                >
                  Learn more <ArrowRight size={16} />
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="agencies" className="bg-[#0b2b46] px-5 py-24 text-white sm:px-8 lg:py-32">
        <div className="mx-auto max-w-[1320px]">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <span className="eyebrow !bg-white/10 !text-[#6fe0e7]">Trusted partners</span>
              <h2 className="section-title mt-4 max-w-3xl !text-white">
                Agencies with a reputation{' '}
                <span className="font-serif font-normal italic text-[#ff8668]">to protect.</span>
              </h2>
            </div>
            <p className="max-w-md leading-7 text-white/60">
              Every agency is identity-checked, quality-reviewed and continuously measured against
              traveler outcomes.
            </p>
          </div>
          {agencies.length > 0 ? (
            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {agencies.map((agency) => (
                <article
                  key={agency.id}
                  className="group overflow-hidden rounded-[30px] border border-white/10 bg-white/[.06] p-3 transition hover:-translate-y-1 hover:bg-white/[.09]"
                >
                  <div className="relative h-48 overflow-hidden rounded-[23px]">
                    <Image
                      src={agency.image}
                      alt={agency.imageAlt}
                      fill
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      className="object-cover transition duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#08233a]/60 to-transparent" />
                    <span className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full bg-white/92 px-3 py-1.5 text-[11px] font-extrabold text-[#0b2944]">
                      <BadgeCheck size={14} className="text-[#0ca7a0]" />
                      Masidy verified
                    </span>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-extrabold">{agency.name}</h3>
                        <p className="mt-1 text-sm text-white/50">{agency.location}</p>
                      </div>
                      <span className="flex items-center gap-1 text-sm font-bold">
                        <Star size={14} className="fill-[#f4ba45] text-[#f4ba45]" />
                        {agency.rating}
                      </span>
                    </div>
                    <p className="mt-4 text-sm font-bold text-[#72dce3]">{agency.specialty}</p>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/60">
                      {agency.description}
                    </p>
                    <div className="mt-5 flex items-center gap-4 border-t border-white/10 pt-4 text-xs text-white/50">
                      <span>{agency.years} years active</span>
                      <span>•</span>
                      <span>{agency.reviews} reviews</span>
                    </div>
                    <Link
                      href={`/agencies/${agency.slug}`}
                      className="mt-4 inline-flex items-center gap-2 text-xs font-extrabold text-[#72dce3]"
                    >
                      View agency <ArrowRight size={14} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-12 rounded-[30px] border border-white/10 bg-white/[.06] px-6 py-14 text-center">
              <ShieldCheck className="mx-auto text-[#72dce3]" size={36} />
              <h3 className="mt-4 text-xl font-extrabold">Verification comes before visibility</h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-white/60">
                Provider profiles will appear automatically after their identity, licensing, support
                contacts and marketplace terms are complete.
              </p>
            </div>
          )}
        </div>
      </section>

      <section
        id="agents"
        className="relative overflow-hidden bg-[#eef9f9] px-5 py-24 sm:px-8 lg:py-32"
      >
        <div className="absolute -right-24 -top-20 size-[430px] rounded-full bg-[#60d7df]/20 blur-[90px]" />
        <div className="mx-auto grid max-w-[1320px] items-center gap-16 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <span className="eyebrow">The agent advantage</span>
            <h2 className="section-title mt-4">
              Your taste has value.{' '}
              <span className="font-serif font-normal italic text-[#168bad]">Earn from it.</span>
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Build a beautiful travel storefront in minutes. Select from verified agency inventory,
              share your point of view and earn commission when your clients book.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                'No inventory risk',
                'Clear commission upfront',
                'Agency-backed fulfillment',
                'Your own shareable storefront',
              ].map((benefit) => (
                <div key={benefit} className="flex items-center gap-3 text-sm font-bold">
                  <span className="grid size-7 place-items-center rounded-full bg-[#0c9f99] text-white">
                    <Check size={15} />
                  </span>
                  {benefit}
                </div>
              ))}
            </div>
            <a
              href="#join"
              className="mt-10 inline-flex items-center gap-2 rounded-full bg-[#0c2f4d] px-6 py-3.5 text-sm font-extrabold text-white shadow-xl shadow-[#0c2f4d]/15 transition hover:-translate-y-0.5"
            >
              Start selling with Masidy
              <ArrowRight size={17} />
            </a>
          </div>

          <div className="relative">
            <div className="rounded-[34px] border border-white bg-white p-4 shadow-[0_35px_100px_rgba(21,66,80,.16)] sm:p-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[.13em] text-slate-400">
                    Agent workspace
                  </p>
                  <h3 className="mt-1 text-xl font-extrabold">Good morning, Amira</h3>
                </div>
                <span className="grid size-10 place-items-center rounded-full bg-[#ff7654] text-sm font-black text-white">
                  AM
                </span>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  ['Commission', '$4,860', '+18%'],
                  ['Bookings', '24', 'This month'],
                  ['Conversion', '8.4%', 'Top 12%'],
                ].map(([label, value, meta]) => (
                  <div key={label} className="rounded-2xl bg-[#f6f8f8] p-4">
                    <p className="text-[11px] font-bold text-slate-400">{label}</p>
                    <p className="mt-2 text-2xl font-black tracking-[-.04em]">{value}</p>
                    <p className="mt-1 text-[11px] font-bold text-[#10a09b]">{meta}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-2xl border border-slate-100 p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold">Your top journeys</h4>
                  <span className="text-xs font-bold text-[#0b8cab]">View all</span>
                </div>
                <div className="mt-4 space-y-3">
                  {trips.slice(0, 3).map((trip, index) => (
                    <div key={trip.id} className="flex items-center gap-3">
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-xl">
                        <Image src={trip.image} alt="" fill sizes="56px" className="object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-extrabold">{trip.title}</p>
                        <p className="mt-1 text-xs text-slate-400">{trip.agencyName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-[#0c9a93]">{trip.commission}%</p>
                        <p className="text-[10px] text-slate-400">commission</p>
                      </div>
                      <span className="hidden text-xs font-bold text-slate-400 sm:block">
                        #{index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute -bottom-7 -left-5 rounded-2xl bg-[#ff654a] px-5 py-4 text-white shadow-xl sm:-left-10">
              <div className="flex items-center gap-3">
                <CircleDollarSign size={26} />
                <div>
                  <p className="text-xs text-white/70">Next payout</p>
                  <p className="text-lg font-black">$1,240.00</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="join" className="px-5 py-24 sm:px-8 lg:py-32">
        <div className="mx-auto max-w-[1320px] overflow-hidden rounded-[44px] bg-gradient-to-br from-[#ff704f] via-[#ff634c] to-[#ed5042] px-7 py-16 text-white shadow-[0_30px_90px_rgba(238,82,61,.25)] sm:px-12 lg:px-20">
          <div className="flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-center">
            <div className="max-w-3xl">
              <span className="text-xs font-extrabold uppercase tracking-[.18em] text-white/70">
                The future of travel is connected
              </span>
              <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-[-.05em] sm:text-5xl lg:text-6xl">
                Join the network that moves travel forward.
              </h2>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:flex-col">
              <a
                href="#journeys"
                className="inline-flex min-w-52 items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-extrabold text-[#d94b38] transition hover:-translate-y-0.5"
              >
                I&apos;m a traveler <ArrowRight size={17} />
              </a>
              <a
                href="#agents"
                className="inline-flex min-w-52 items-center justify-center gap-2 rounded-full border border-white/35 bg-white/10 px-6 py-3.5 text-sm font-extrabold text-white transition hover:bg-white/20"
              >
                I&apos;m an agent
              </a>
              <a
                href="/admin"
                className="inline-flex min-w-52 items-center justify-center gap-2 rounded-full border border-white/35 bg-white/10 px-6 py-3.5 text-sm font-extrabold text-white transition hover:bg-white/20"
              >
                I run an agency
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-5 py-12 sm:px-8">
        <div className="mx-auto flex max-w-[1320px] flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div>
            <Image
              src="/masidy-logo.png"
              alt="Masidy, your travel partner"
              width={959}
              height={313}
              className="h-12 w-auto"
            />
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-500">
              The connected marketplace for travelers, trusted agencies and the agents who bring
              great journeys to life.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-bold text-slate-500">
            <a href="#journeys">Explore</a>
            <a href="#agencies">Agencies</a>
            <a href="#agents">For agents</a>
            <a href="#how">How it works</a>
            <a href="/demo">Live demo</a>
            <a href="/admin">Agency portal</a>
            <Link href="/legal/terms">Terms</Link>
            <Link href="/legal/privacy">Privacy</Link>
            <Link href="/legal/cancellations">Cancellations</Link>
          </div>
        </div>
        <div className="mx-auto mt-10 flex max-w-[1320px] flex-col justify-between gap-3 border-t border-slate-100 pt-6 text-xs text-slate-400 sm:flex-row">
          <p>© 2026 Masidy. Travel works better together.</p>
          <p>Built around trust, transparency and human expertise.</p>
        </div>
      </footer>

      {selectedTrip && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="booking-title"
          className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-[#061b2c]/70 p-4 backdrop-blur-sm"
        >
          <div className="my-6 w-full max-w-3xl overflow-hidden rounded-[30px] bg-white shadow-2xl">
            <div className="grid md:grid-cols-[.8fr_1.2fr]">
              <div className="relative hidden min-h-[580px] md:block">
                <Image
                  src={selectedTrip.image}
                  alt={selectedTrip.imageAlt}
                  fill
                  sizes="320px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#092941]/85 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-7 text-white">
                  <p className="text-xs font-bold uppercase tracking-[.14em] text-white/60">
                    {selectedTrip.agencyName}
                  </p>
                  <h3 className="mt-2 text-2xl font-extrabold">{selectedTrip.title}</h3>
                  <p className="mt-2 text-sm text-white/70">
                    {selectedTrip.days} days · from{' '}
                    {currency(selectedTrip.price, selectedTrip.currency)}
                  </p>
                </div>
              </div>
              <div className="relative p-6 sm:p-8">
                <button
                  type="button"
                  onClick={() => setSelectedTrip(null)}
                  className="absolute right-5 top-5 grid size-9 place-items-center rounded-full bg-slate-100 text-slate-500"
                  aria-label="Close booking request"
                >
                  <X size={18} />
                </button>
                <p className="eyebrow inline-flex">Request to book</p>
                <h2
                  id="booking-title"
                  className="mt-4 pr-10 text-3xl font-extrabold tracking-[-.045em]"
                >
                  Let&apos;s plan {selectedTrip.destination}.
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  No payment yet. A verified travel partner will confirm availability and create
                  your final quote.
                </p>
                <button
                  type="button"
                  disabled={checkoutBusy}
                  onClick={() => startCheckout(selectedTrip)}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0c2f4d] px-5 py-3.5 text-sm font-extrabold text-white transition hover:bg-[#153e60] disabled:opacity-60"
                >
                  <CreditCard size={17} />
                  {checkoutBusy
                    ? 'Opening secure checkout...'
                    : `Book 1 traveler · ${currency(selectedTrip.price, selectedTrip.currency)}`}
                </button>
                {checkoutMessage && (
                  <p className="mt-2 rounded-xl bg-amber-50 px-4 py-3 text-xs font-bold leading-5 text-amber-700">
                    {checkoutMessage}
                  </p>
                )}

                {state.status === 'success' ? (
                  <div className="mt-10 rounded-2xl bg-[#eafaf5] p-6 text-center">
                    <span className="mx-auto grid size-12 place-items-center rounded-full bg-[#11a486] text-white">
                      <Check size={24} />
                    </span>
                    <h3 className="mt-4 text-xl font-extrabold">Request received</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{state.message}</p>
                  </div>
                ) : (
                  <form action={formAction} className="mt-7 space-y-4">
                    <input type="hidden" name="trip" value={selectedTrip.id} />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field
                        label="Full name"
                        name="travelerName"
                        placeholder="Your name"
                        error={state.fieldErrors?.travelerName}
                      />
                      <Field
                        label="Email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        error={state.fieldErrors?.email}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field
                        label="Travelers"
                        name="travelers"
                        type="number"
                        min="1"
                        max="20"
                        defaultValue="2"
                        error={state.fieldErrors?.travelers}
                      />
                      <Field
                        label="Preferred month"
                        name="preferredMonth"
                        placeholder="e.g. October 2026"
                        error={state.fieldErrors?.preferredMonth}
                      />
                    </div>
                    <Field
                      label="Phone (optional)"
                      name="phone"
                      placeholder="+1 555 000 0000"
                      error={state.fieldErrors?.phone}
                    />
                    <label className="block">
                      <span className="mb-2 block text-xs font-extrabold text-slate-600">
                        Anything we should know? (optional)
                      </span>
                      <textarea
                        name="note"
                        rows={3}
                        placeholder="Celebration, room preference, accessibility needs..."
                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#21a6ba] focus:bg-white focus:ring-4 focus:ring-[#21a6ba]/10"
                      />
                      {state.fieldErrors?.note && (
                        <span className="mt-1 block text-xs font-bold text-red-500">
                          {state.fieldErrors.note}
                        </span>
                      )}
                    </label>
                    {state.status === 'error' && (
                      <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                        {state.message}
                      </p>
                    )}
                    <Turnstile />
                    <button
                      type="submit"
                      disabled={pending}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff6047] px-5 py-3.5 text-sm font-extrabold text-white transition hover:bg-[#ef533b] disabled:cursor-wait disabled:opacity-60"
                    >
                      {pending ? 'Sending request...' : 'Request this journey'}
                      {!pending && <ArrowRight size={17} />}
                    </button>
                    <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-400">
                      <ShieldCheck size={13} />
                      Your details are shared only with the fulfilling agency.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function Field({
  label,
  error,
  ...props
}: {
  label: string
  error?: string
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-extrabold text-slate-600">{label}</span>
      <input
        {...props}
        className={`w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm outline-none transition focus:bg-white focus:ring-4 ${
          error
            ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
            : 'border-slate-200 focus:border-[#21a6ba] focus:ring-[#21a6ba]/10'
        }`}
      />
      {error && <span className="mt-1 block text-xs font-bold text-red-500">{error}</span>}
    </label>
  )
}
