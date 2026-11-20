import { getCurrentUser } from '@/lib/current-user'
import { getPayloadClient } from '@/lib/payload'
import { getStripeClient } from '@/lib/stripe'
import type { Where } from 'payload'
import { enforceRateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user || !['agent', 'agency'].includes(user.role)) {
    return Response.json({ error: 'Verified partner access is required.' }, { status: 403 })
  }
  try {
    await enforceRateLimit(String(user.id), 'stripe-connect', 5, 60 * 60 * 1000)
  } catch {
    return Response.json(
      { error: 'Too many onboarding attempts. Try again later.' },
      { status: 429 },
    )
  }
  const stripe = getStripeClient()
  const siteURL = process.env.NEXT_PUBLIC_SITE_URL
  if (!stripe || !siteURL) {
    return Response.json({ error: 'Stripe Connect is ready for configuration.' }, { status: 503 })
  }
  const input = (await request.json().catch(() => null)) as { agencyId?: unknown } | null
  const agencyId = typeof input?.agencyId === 'string' ? input.agencyId : ''
  const payload = await getPayloadClient()
  const where: Where =
    user.role === 'agent' ? { user: { equals: user.id } } : { agency: { equals: agencyId } }
  try {
    const existing = await payload.find({
      collection: 'payment-accounts',
      user,
      overrideAccess: false,
      where,
      limit: 1,
    })
    let accountID = existing.docs[0]?.stripeAccountId
    if (!accountID) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
        capabilities: {
          transfers: { requested: true },
        },
        metadata: {
          userId: String(user.id),
          ...(agencyId ? { agencyId } : {}),
        },
      })
      accountID = account.id
      await payload.create({
        collection: 'payment-accounts',
        user,
        overrideAccess: false,
        draft: false,
        context: { stripeConnect: true },
        data: {
          stripeAccountId: account.id,
          ...(agencyId ? { agency: agencyId } : {}),
        } as never,
      })
    }
    const link = await stripe.accountLinks.create({
      account: accountID,
      refresh_url: `${siteURL}/dashboard/finance?connect=refresh`,
      return_url: `${siteURL}/dashboard/finance?connect=complete`,
      type: 'account_onboarding',
    })
    return Response.json({ url: link.url })
  } catch {
    return Response.json({ error: 'Stripe onboarding could not be started.' }, { status: 400 })
  }
}
