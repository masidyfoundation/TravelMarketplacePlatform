import { getCurrentUser } from '@/lib/current-user'
import { getPayloadClient } from '@/lib/payload'
import { getStripeClient } from '@/lib/stripe'
import { enforceRateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return Response.json({ error: 'Sign in to continue.' }, { status: 401 })
  }
  try {
    await enforceRateLimit(String(user.id), 'checkout', 10, 15 * 60 * 1000)
  } catch {
    return Response.json({ error: 'Too many checkout attempts. Try again later.' }, { status: 429 })
  }
  const stripe = getStripeClient()
  const siteURL = process.env.NEXT_PUBLIC_SITE_URL
  if (!stripe || !siteURL) {
    return Response.json(
      { error: 'Stripe is ready for configuration. Add the Stripe secrets in Make.' },
      { status: 503 },
    )
  }

  const body = (await request.json().catch(() => null)) as {
    tripId?: unknown
    travelers?: unknown
    departureId?: unknown
    agentSlug?: unknown
  } | null
  const tripId = typeof body?.tripId === 'string' ? body.tripId : ''
  const travelers = Number(body?.travelers)
  const departureId = typeof body?.departureId === 'string' ? body.departureId.trim() : ''
  const agentSlug = typeof body?.agentSlug === 'string' ? body.agentSlug.trim() : ''
  if (!tripId || !Number.isInteger(travelers) || travelers < 1 || travelers > 20) {
    return Response.json({ error: 'Invalid checkout request.' }, { status: 400 })
  }

  const payload = await getPayloadClient()
  try {
    const trip = await payload.findByID({
      collection: 'trips',
      id: tripId,
      user,
      overrideAccess: false,
      depth: 1,
    })
    if (trip.status !== 'active') {
      return Response.json({ error: 'This journey is not currently bookable.' }, { status: 409 })
    }

    let attributionAgentID: string | undefined
    if (agentSlug) {
      const profiles = await payload.find({
        collection: 'agent-profiles',
        where: {
          and: [{ slug: { equals: agentSlug } }, { status: { equals: 'published' } }],
        },
        limit: 1,
        depth: 0,
        overrideAccess: false,
      })
      const profile = profiles.docs[0]
      if (profile) {
        const ownerID = typeof profile.owner === 'string' ? profile.owner : String(profile.owner.id)
        const listings = await payload.find({
          collection: 'agent-listings',
          where: {
            and: [
              { agent: { equals: ownerID } },
              { trip: { equals: trip.id } },
              { status: { equals: 'active' } },
            ],
          },
          limit: 1,
          overrideAccess: false,
        })
        if (listings.totalDocs > 0) attributionAgentID = ownerID
      }
    }

    if (departureId) {
      const departure = await payload.findByID({
        collection: 'departures',
        id: departureId,
        user,
        overrideAccess: false,
      })
      const departureTripID =
        typeof departure.trip === 'string' ? departure.trip : String(departure.trip.id)
      if (
        departureTripID !== String(trip.id) ||
        !['open', 'guaranteed'].includes(departure.status)
      ) {
        return Response.json({ error: 'That departure is no longer available.' }, { status: 409 })
      }
      const holds = await payload.find({
        collection: 'reservation-holds',
        where: {
          and: [
            { departure: { equals: departure.id } },
            { status: { equals: 'active' } },
            { expiresAt: { greater_than: new Date().toISOString() } },
          ],
        },
        limit: 500,
        overrideAccess: true,
      })
      const heldSeats = holds.docs.reduce((sum, hold) => sum + hold.seats, 0)
      if (departure.capacity - departure.booked - heldSeats < travelers) {
        return Response.json(
          { error: 'Not enough places remain on that departure.' },
          { status: 409 },
        )
      }
    }

    const order = await payload.create({
      collection: 'orders',
      user,
      overrideAccess: false,
      draft: false,
      context: { attributionAgentID },
      data: {
        trip: trip.id,
        travelers,
        ...(departureId ? { departure: departureId } : {}),
      } as never,
    })

    let holdID: string | undefined
    if (departureId) {
      const hold = await payload.create({
        collection: 'reservation-holds',
        user,
        overrideAccess: false,
        draft: false,
        data: {
          departure: departureId,
          order: order.id,
          seats: travelers,
          ...(attributionAgentID ? { agent: attributionAgentID } : {}),
        } as never,
      })
      holdID = String(hold.id)
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email,
      success_url: `${siteURL}/dashboard?payment=success`,
      cancel_url: `${siteURL}/?payment=cancelled#journeys`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: trip.currency.toLowerCase(),
            unit_amount: Math.round(order.total * 100),
            product_data: {
              name: trip.title,
              description: `${trip.durationDays}-day journey to ${trip.destination} for ${travelers} traveler${travelers > 1 ? 's' : ''}`,
            },
          },
        },
      ],
      metadata: {
        orderId: order.id,
        orderReference: order.reference,
        userId: user.id,
        tripId: trip.id,
        ...(departureId ? { departureId } : {}),
        ...(holdID ? { holdId: holdID } : {}),
        ...(attributionAgentID ? { agentId: attributionAgentID } : {}),
      },
    })

    await payload.update({
      collection: 'orders',
      id: order.id,
      user,
      overrideAccess: false,
      data: { stripeCheckoutSessionId: session.id },
    })

    return Response.json({ url: session.url })
  } catch {
    return Response.json(
      { error: 'Checkout could not be started. Please try again.' },
      { status: 500 },
    )
  }
}
