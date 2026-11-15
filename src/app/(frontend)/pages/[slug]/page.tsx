import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, Sparkles } from 'lucide-react'
import { notFound } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'
import { getPublishedPage } from '@/lib/public-records'

export const dynamic = 'force-static'

export async function generateStaticParams() {
  const payload = await getPayloadClient()
  const pages = await payload.find({
    collection: 'ai-projects',
    where: { status: { equals: 'published' } },
    limit: 500,
    overrideAccess: false,
  })
  return pages.docs.flatMap((page) => (page.slug ? [{ slug: page.slug }] : []))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const page = await getPublishedPage(slug)
  if (!page) return {}
  const first = page.sections?.[0]
  return {
    title: `${page.title} | Masidy`,
    description: first?.body.slice(0, 160) ?? page.prompt.slice(0, 160),
  }
}

export default async function PublishedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = await getPublishedPage(slug)
  if (!page) notFound()
  return (
    <main className="min-h-screen bg-[#f8f8f5] text-[#0b2944]">
      <nav className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-6 sm:px-8">
        <Link href="/" className="text-lg font-black">
          Masidy
        </Link>
        <span className="flex items-center gap-2 text-xs font-extrabold text-[#0b8da8]">
          <Sparkles size={14} /> Created with Masidy Make
        </span>
      </nav>
      {(page.sections ?? []).map((section, index) => (
        <section
          key={section.id}
          className={
            index === 0
              ? 'bg-[#0b2e4a] px-5 py-24 text-white sm:px-8 lg:py-36'
              : 'px-5 py-16 sm:px-8 lg:py-24'
          }
        >
          <div className="mx-auto max-w-[1000px]">
            {section.eyebrow && (
              <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#67dce2]">
                {section.eyebrow}
              </p>
            )}
            <h1
              className={`${index === 0 ? 'text-5xl sm:text-7xl' : 'text-3xl sm:text-5xl'} mt-3 font-black leading-[.95] tracking-[-.055em]`}
            >
              {section.heading}
            </h1>
            <p
              className={`mt-6 max-w-3xl whitespace-pre-wrap text-base leading-8 ${index === 0 ? 'text-white/60' : 'text-slate-600'}`}
            >
              {section.body}
            </p>
            {section.ctaLabel && section.ctaHref && (
              <Link
                href={section.ctaHref}
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#ff654c] px-6 py-3 text-sm font-extrabold text-white"
              >
                {section.ctaLabel} <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </section>
      ))}
    </main>
  )
}
