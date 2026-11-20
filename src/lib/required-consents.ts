import 'server-only'

import type { User } from '@/payload-types'
import { getPayloadClient } from '@/lib/payload'

export async function hasRequiredConsents(user: User) {
  const payload = await getPayloadClient()
  const [consents, policies] = await Promise.all([
    payload.find({
      collection: 'consents',
      user,
      overrideAccess: false,
      where: {
        and: [
          { owner: { equals: user.id } },
          { type: { in: ['terms', 'privacy'] } },
          { granted: { equals: true } },
        ],
      },
      limit: 10,
    }),
    payload.find({
      collection: 'legal-policies',
      where: {
        and: [{ slug: { in: ['terms', 'privacy'] } }, { status: { equals: 'published' } }],
      },
      limit: 2,
      overrideAccess: false,
    }),
  ])
  return (['terms', 'privacy'] as const).every((type) => {
    const version = policies.docs.find((policy) => policy.slug === type)?.version
    return Boolean(
      version &&
      consents.docs.some(
        (consent) => consent.type === type && consent.granted && consent.policyVersion === version,
      ),
    )
  })
}
