'use server'

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/current-user'
import { getPayloadClient } from '@/lib/payload'

export async function acceptRequiredConsents(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (formData.get('terms') !== 'accepted' || formData.get('privacy') !== 'accepted') {
    redirect('/consent?error=1')
  }
  const payload = await getPayloadClient()
  const policies = await payload.find({
    collection: 'legal-policies',
    where: {
      and: [{ slug: { in: ['terms', 'privacy'] } }, { status: { equals: 'published' } }],
    },
    limit: 2,
    overrideAccess: false,
  })
  if (policies.totalDocs !== 2) redirect('/consent?error=policy')
  for (const type of ['terms', 'privacy'] as const) {
    const policy = policies.docs.find((item) => item.slug === type)
    if (!policy) redirect('/consent?error=policy')
    const existing = await payload.find({
      collection: 'consents',
      user,
      overrideAccess: false,
      where: {
        and: [{ owner: { equals: user.id } }, { type: { equals: type } }],
      },
      limit: 1,
    })
    const data = {
      type,
      policyVersion: policy.version,
      granted: true,
      recordedAt: new Date().toISOString(),
    }
    if (existing.docs[0]) {
      await payload.update({
        collection: 'consents',
        id: existing.docs[0].id,
        user,
        overrideAccess: false,
        context: { verifiedConsent: true },
        data,
      })
    } else {
      await payload.create({
        collection: 'consents',
        user,
        overrideAccess: false,
        draft: false,
        context: { verifiedConsent: true },
        data: data as never,
      })
    }
  }
  redirect('/dashboard')
}
