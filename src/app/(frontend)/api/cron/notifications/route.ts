import { timingSafeEqual } from 'node:crypto'
import { sendTransactionalEmail } from '@/lib/email'
import { getPayloadClient } from '@/lib/payload'

const validSecret = (request: Request) => {
  const expected = process.env.CRON_SECRET
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!expected || !supplied) return false
  const a = Buffer.from(expected)
  const b = Buffer.from(supplied)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(request: Request) {
  if (!validSecret(request)) return new Response('Unauthorized', { status: 401 })
  const payload = await getPayloadClient()
  const now = new Date().toISOString()
  const due = await payload.find({
    collection: 'notifications',
    where: {
      or: [
        {
          and: [
            { deliveryStatus: { equals: 'scheduled' } },
            { scheduledFor: { less_than_equal: now } },
          ],
        },
        {
          and: [
            { deliveryStatus: { equals: 'failed' } },
            { nextAttemptAt: { less_than_equal: now } },
            { attempts: { less_than: 5 } },
          ],
        },
      ],
    },
    depth: 1,
    limit: 100,
    overrideAccess: true,
  })
  let sent = 0
  let failed = 0
  for (const notification of due.docs) {
    const recipient =
      typeof notification.recipient === 'object'
        ? notification.recipient
        : await payload.findByID({
            collection: 'users',
            id: notification.recipient,
            overrideAccess: true,
          })
    try {
      const result = await sendTransactionalEmail({
        to: recipient.email,
        subject: notification.title,
        html: `<h1>${notification.title}</h1><p>${notification.body}</p>`,
      })
      if (!result.configured) throw new Error('Email provider is not configured.')
      await payload.update({
        collection: 'notifications',
        id: notification.id,
        overrideAccess: true,
        data: {
          deliveryStatus: 'sent',
          attempts: notification.attempts + 1,
          lastError: null,
          nextAttemptAt: null,
        },
      })
      sent += 1
    } catch (error) {
      const attempts = notification.attempts + 1
      await payload.update({
        collection: 'notifications',
        id: notification.id,
        overrideAccess: true,
        data: {
          deliveryStatus: 'failed',
          attempts,
          lastError: error instanceof Error ? error.message : 'Delivery failed',
          nextAttemptAt: new Date(
            Date.now() + Math.min(24, 2 ** attempts) * 60 * 60 * 1000,
          ).toISOString(),
        },
      })
      failed += 1
    }
  }
  return Response.json({ processed: due.totalDocs, sent, failed })
}
