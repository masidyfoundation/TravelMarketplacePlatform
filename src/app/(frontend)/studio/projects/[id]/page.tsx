import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/current-user'
import { getPayloadClient } from '@/lib/payload'
import ProjectEditor from './project-editor'

export default async function StudioProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const { id } = await params
  const payload = await getPayloadClient()
  const [project, brandKits] = await Promise.all([
    payload
      .findByID({
        collection: 'ai-projects',
        id,
        user,
        overrideAccess: false,
      })
      .catch(() => null),
    payload.find({
      collection: 'brand-kits',
      user,
      overrideAccess: false,
      limit: 100,
      sort: 'name',
    }),
  ])
  if (!project) notFound()
  const first = project.sections?.[0]
  const generated =
    typeof project.generatedContent === 'object' &&
    project.generatedContent &&
    'text' in project.generatedContent
      ? String(project.generatedContent.text)
      : ''
  return (
    <main className="min-h-screen bg-[#071d2f] px-5 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/studio"
          className="inline-flex items-center gap-2 text-xs font-extrabold text-white/50"
        >
          <ArrowLeft size={15} /> Back to Studio
        </Link>
        <p className="mt-10 text-xs font-extrabold uppercase tracking-[.16em] text-[#67dce2]">
          Visual publishing
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-[-.05em]">{project.title}</h1>
        <p className="mt-2 text-sm text-white/40">
          {project.versions?.length ?? 0} saved versions · {project.status}
        </p>
        <div className="mt-8 rounded-[28px] border border-white/10 bg-[#0b2943] p-6 sm:p-8">
          <ProjectEditor
            project={{
              id: String(project.id),
              slug:
                project.slug ??
                project.title
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, '-')
                  .replace(/^-|-$/g, ''),
              status: project.status,
              template: project.template ?? 'editorial',
              brandKit:
                typeof project.brandKit === 'string'
                  ? project.brandKit
                  : project.brandKit?.id
                    ? String(project.brandKit.id)
                    : '',
              brandKits: brandKits.docs.map((kit) => ({
                id: String(kit.id),
                name: kit.name,
              })),
              sections: project.sections?.map((section) => ({
                type: section.type,
                eyebrow: section.eyebrow ?? undefined,
                heading: section.heading,
                body: section.body,
                ctaLabel: section.ctaLabel ?? undefined,
                ctaHref: section.ctaHref ?? undefined,
              })) ?? [
                {
                  type: 'hero',
                  heading: first?.heading ?? project.title,
                  body: first?.body ?? generated,
                },
              ],
            }}
          />
        </div>
      </div>
    </main>
  )
}
