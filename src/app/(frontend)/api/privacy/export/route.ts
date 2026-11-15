import { getCurrentUser } from '@/lib/current-user'
import { getPayloadClient } from '@/lib/payload'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return new Response('Unauthorized', { status: 401 })
  const payload = await getPayloadClient()
  const collections = [
    'orders',
    'saved-trips',
    'applications',
    'traveler-profiles',
    'consents',
    'data-requests',
    'support-tickets',
    'proposals',
  ] as const
  const records = await Promise.all(
    collections.map(async (collection) => {
      const result = await payload.find({
        collection,
        user,
        overrideAccess: false,
        limit: 500,
      })
      return [collection, result.docs]
    }),
  )
  return new Response(
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        account: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
        records: Object.fromEntries(records),
      },
      null,
      2,
    ),
    {
      headers: {
        'content-type': 'application/json',
        'content-disposition': 'attachment; filename="masidy-data-export.json"',
      },
    },
  )
}
