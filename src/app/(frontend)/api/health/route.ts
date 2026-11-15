import { getPayloadClient } from '@/lib/payload'

export async function GET() {
  try {
    const payload = await getPayloadClient()
    await payload.find({
      collection: 'trips',
      limit: 1,
      overrideAccess: false,
    })
    return Response.json({
      status: 'ok',
      database: 'reachable',
      timestamp: new Date().toISOString(),
    })
  } catch {
    return Response.json(
      {
        status: 'degraded',
        database: 'unreachable',
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    )
  }
}
