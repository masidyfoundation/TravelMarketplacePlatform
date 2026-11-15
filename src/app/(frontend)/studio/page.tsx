import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/current-user'
import { getPayloadClient } from '@/lib/payload'
import StudioClient from './studio-client'

export const dynamic = 'force-dynamic'

export default async function StudioPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const payload = await getPayloadClient()
  const [projects, brandKits] = await Promise.all([
    payload.find({
      collection: 'ai-projects',
      user,
      overrideAccess: false,
      limit: 30,
      sort: '-updatedAt',
    }),
    payload.find({
      collection: 'brand-kits',
      user,
      overrideAccess: false,
      limit: 30,
      sort: 'name',
    }),
  ])

  return (
    <StudioClient
      configured={Boolean(process.env.APP_OPENAI_API_KEY)}
      role={user.role}
      brandKits={brandKits.docs.map((kit) => ({
        id: String(kit.id),
        name: kit.name,
      }))}
      projects={projects.docs.map((project) => ({
        id: project.id,
        title: project.title,
        type: project.type,
        status: project.status,
        updatedAt: project.updatedAt,
      }))}
    />
  )
}
