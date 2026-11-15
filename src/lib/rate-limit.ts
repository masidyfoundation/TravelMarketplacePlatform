import 'server-only'

import { createHash } from 'node:crypto'
import { getPayloadClient } from '@/lib/payload'

export async function enforceRateLimit(
  identity: string,
  scope: string,
  maximum: number,
  windowMs: number,
) {
  const payload = await getPayloadClient()
  const key = createHash('sha256').update(`${scope}:${identity}`).digest('hex')
  const now = Date.now()
  const result = await payload.find({
    collection: 'rate-limits',
    where: { key: { equals: key } },
    limit: 1,
    overrideAccess: true,
  })
  const current = result.docs[0]
  if (!current || new Date(current.expiresAt).getTime() <= now) {
    if (current) {
      await payload.update({
        collection: 'rate-limits',
        id: current.id,
        overrideAccess: true,
        data: {
          count: 1,
          windowStartedAt: new Date(now).toISOString(),
          expiresAt: new Date(now + windowMs).toISOString(),
        },
      })
    } else {
      await payload.create({
        collection: 'rate-limits',
        overrideAccess: true,
        draft: false,
        data: {
          key,
          count: 1,
          windowStartedAt: new Date(now).toISOString(),
          expiresAt: new Date(now + windowMs).toISOString(),
        },
      })
    }
    return
  }
  if (current.count >= maximum) throw new Error('RATE_LIMITED')
  await payload.update({
    collection: 'rate-limits',
    id: current.id,
    overrideAccess: true,
    data: { count: current.count + 1 },
  })
}
