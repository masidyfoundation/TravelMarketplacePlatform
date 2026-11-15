import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'
import { findBySlug } from '@/lib/payload'

export const dynamic = 'force-static'

export async function generateStaticParams() {
  const payload = await getPayloadClient()
  const policies = await payload.find({
    collection: 'legal-policies',
    where: { status: { equals: 'published' } },
    limit: 100,
    overrideAccess: false,
  })
  return policies.docs.map((policy) => ({ slug: policy.slug }))
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const policy = await findBySlug('legal-policies', slug)
  if (!policy || policy.status !== 'published') notFound()
  return (
    <main className="min-h-screen bg-[#f8f8f5] px-5 py-10 text-[#0b2944] sm:px-8">
      <article className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-extrabold text-[#0b8da8]">
          Masidy
        </Link>
        <p className="mt-12 text-xs font-extrabold uppercase tracking-[.16em] text-slate-400">
          Version {policy.version} · Effective {new Date(policy.effectiveAt).toLocaleDateString()}
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-[-.05em] sm:text-6xl">{policy.title}</h1>
        <p className="mt-5 text-lg leading-8 text-slate-500">{policy.summary}</p>
        <div className="mt-10 whitespace-pre-wrap rounded-[28px] bg-white p-6 text-sm leading-8 text-slate-600 shadow-sm sm:p-10">
          {policy.body}
        </div>
      </article>
    </main>
  )
}
