import { getCurrentUser } from '@/lib/current-user'
import { getPayloadClient } from '@/lib/payload'
import { enforceRateLimit } from '@/lib/rate-limit'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return Response.json({ tripIDs: [] }, { status: 401 })
  const payload = await getPayloadClient()
  const saved = await payload.find({
    collection: 'saved-trips',
    user,
    overrideAccess: false,
    where: { owner: { equals: user.id } },
    limit: 500,
  })
  return Response.json({
    tripIDs: saved.docs.map((entry) =>
      typeof entry.trip === 'string' ? entry.trip : String(entry.trip.id),
    ),
  })
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return Response.json({ error: 'Sign in to save journeys.' }, { status: 401 })
  try {
    await enforceRateLimit(String(user.id), 'saved-trips', 60, 15 * 60 * 1000)
  } catch {
    return Response.json({ error: 'Too many save requests. Try again later.' }, { status: 429 })
  }
  const input = (await request.json().catch(() => null)) as { tripId?: unknown } | null
  const tripId = typeof input?.tripId === 'string' ? input.tripId.trim() : ''
  if (!tripId || tripId.length > 100) {
    return Response.json({ error: 'Choose a valid journey.' }, { status: 400 })
  }
  const payload = await getPayloadClient()
  const existing = await payload.find({
    collection: 'saved-trips',
    user,
    overrideAccess: false,
    where: {
      and: [{ owner: { equals: user.id } }, { trip: { equals: tripId } }],
    },
    limit: 1,
  })
  try {
    if (existing.docs[0]) {
      await payload.delete({
        collection: 'saved-trips',
        id: existing.docs[0].id,
        user,
        overrideAccess: false,
      })
      return Response.json({ saved: false })
    }
    await payload.create({
      collection: 'saved-trips',
      user,
      overrideAccess: false,
      draft: false,
      data: { trip: tripId } as never,
    })
    return Response.json({ saved: true })
  } catch {
    return Response.json({ error: 'This journey could not be saved.' }, { status: 400 })
  }
}
