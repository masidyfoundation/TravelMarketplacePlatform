'use server'

import { getCurrentUser } from '@/lib/current-user'
import { getPayloadClient } from '@/lib/payload'

export async function requestDeletion() {
  const user = await getCurrentUser()
  if (!user) return
  const payload = await getPayloadClient()
  const existing = await payload.find({
    collection: 'data-requests',
    user,
    overrideAccess: false,
    where: {
      and: [
        { owner: { equals: user.id } },
        { type: { equals: 'deletion' } },
        { status: { in: ['requested', 'identity-check', 'processing'] } },
      ],
    },
    limit: 1,
  })
  if (existing.totalDocs === 0) {
    await payload.create({
      collection: 'data-requests',
      user,
      overrideAccess: false,
      draft: false,
      data: { type: 'deletion', reason: 'Requested from account privacy center.' } as never,
    })
  }
}

export async function updateConsent(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) return
  const type = String(formData.get('type') ?? '')
  if (!['marketing', 'analytics'].includes(type)) return
  const granted = formData.get('granted') === 'true'
  const payload = await getPayloadClient()
  const existing = await payload.find({
    collection: 'consents',
    user,
    overrideAccess: false,
    where: {
      and: [{ owner: { equals: user.id } }, { type: { equals: type } }],
    },
    limit: 1,
  })
  if (existing.docs[0]) {
    await payload.update({
      collection: 'consents',
      id: existing.docs[0].id,
      user,
      overrideAccess: false,
      data: {
        granted,
        policyVersion: 'current',
        recordedAt: new Date().toISOString(),
      },
    })
  } else {
    await payload.create({
      collection: 'consents',
      user,
      overrideAccess: false,
      draft: false,
      data: {
        type,
        granted,
        policyVersion: 'current',
      } as never,
    })
  }
}
