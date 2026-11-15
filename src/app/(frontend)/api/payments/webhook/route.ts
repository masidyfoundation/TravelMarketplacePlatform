import type Stripe from 'stripe'
import { randomUUID } from 'node:crypto'
import { getPayloadClient } from '@/lib/payload'
import { getStripeClient } from '@/lib/stripe'
import { sendTransactionalEmail } from '@/lib/email'

export async function POST(request: Request) {
  const stripe = getStripeClient()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripe || !webhookSecret) {
    return new Response('Stripe webhook is not configured.', { status: 503 })
  }
  const signature = request.headers.get('stripe-signature')
  if (!signature) return new Response('Missing Stripe signature.', { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, webhookSecret)
  } catch {
    return new Response('Invalid Stripe signature.', { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const orderId = session.metadata?.orderId
    if (orderId) {
      const payload = await getPayloadClient()
      await payload.update({
        collection: 'orders',
        id: orderId,
        overrideAccess: true,
        data: {
          status: session.payment_status === 'paid' ? 'paid' : 'pending',
          stripePaymentIntentId:
            typeof session.payment_intent === 'string'
              ? session.payment_intent
              : session.payment_intent?.id,
          paidAt: session.payment_status === 'paid' ? new Date().toISOString() : undefined,
          voucherCode:
            session.payment_status === 'paid'
              ? `VCH-${randomUUID().slice(0, 10).toUpperCase()}`
              : undefined,
          voucherIssuedAt: session.payment_status === 'paid' ? new Date().toISOString() : undefined,
        },
      })
      if (session.payment_status === 'paid') {
        const order = await payload.findByID({
          collection: 'orders',
          id: orderId,
          depth: 0,
          overrideAccess: true,
        })
        const existingInvoice = await payload.find({
          collection: 'invoices',
          where: { order: { equals: order.id } },
          limit: 1,
          overrideAccess: true,
        })
        if (existingInvoice.totalDocs === 0) {
          await payload.create({
            collection: 'invoices',
            overrideAccess: true,
            draft: false,
            data: {
              number: `INV-${randomUUID().slice(0, 10).toUpperCase()}`,
              order: order.id,
              customer: typeof order.traveler === 'string' ? order.traveler : order.traveler.id,
              subtotal: order.subtotal ?? order.total,
              tax: order.taxAmount ?? 0,
              total: order.total,
              currency: order.currency,
              issuedAt: new Date().toISOString(),
              status: 'paid',
            },
          })
        }
        const ledger = await payload.find({
          collection: 'ledger-entries',
          where: {
            and: [{ order: { equals: order.id } }, { type: { equals: 'gross' } }],
          },
          limit: 1,
          overrideAccess: true,
        })
        if (ledger.totalDocs === 0) {
          const agencyID = typeof order.agency === 'string' ? order.agency : order.agency.id
          const agentID = order.agent
            ? typeof order.agent === 'string'
              ? order.agent
              : order.agent.id
            : undefined
          const agencyNet =
            order.total - (order.platformFeeAmount ?? 0) - (order.agentCommissionAmount ?? 0)
          const entries = [
            { type: 'gross', amount: order.total },
            { type: 'platform-fee', amount: -(order.platformFeeAmount ?? 0) },
            ...(agentID
              ? [
                  {
                    type: 'agent-commission',
                    amount: order.agentCommissionAmount ?? 0,
                    user: agentID,
                  },
                ]
              : []),
            { type: 'agency-net', amount: agencyNet, agency: agencyID },
          ]
          for (const entry of entries) {
            await payload.create({
              collection: 'ledger-entries',
              overrideAccess: true,
              draft: false,
              data: {
                order: order.id,
                currency: order.currency,
                ...entry,
              } as never,
            })
          }
          const transferGroup = `ORDER_${order.id}`
          const beneficiaries = [
            { amount: agencyNet, agency: agencyID },
            ...(agentID && (order.agentCommissionAmount ?? 0) > 0
              ? [{ amount: order.agentCommissionAmount ?? 0, user: agentID }]
              : []),
          ]
          for (const beneficiary of beneficiaries) {
            const accounts = await payload.find({
              collection: 'payment-accounts',
              where: beneficiary.user
                ? { user: { equals: beneficiary.user } }
                : { agency: { equals: beneficiary.agency } },
              limit: 1,
              overrideAccess: true,
            })
            const account = accounts.docs[0]
            if (!account?.payoutsEnabled || beneficiary.amount <= 0) continue
            await stripe.transfers.create(
              {
                amount: Math.round(beneficiary.amount * 100),
                currency: order.currency.toLowerCase(),
                destination: account.stripeAccountId,
                transfer_group: transferGroup,
              },
              {
                idempotencyKey: `${order.id}:${account.stripeAccountId}`,
              },
            )
          }
        }
      }
      if (session.payment_status === 'paid' && session.metadata?.userId) {
        await payload.create({
          collection: 'notifications',
          overrideAccess: true,
          draft: false,
          data: {
            recipient: session.metadata.userId,
            type: 'payment',
            title: 'Payment received',
            body: 'Your journey payment is confirmed and your travel voucher is ready.',
            href: '/dashboard',
            deliveryStatus: 'in-app',
            attempts: 0,
          },
        })
        if (session.customer_details?.email) {
          await sendTransactionalEmail({
            to: session.customer_details.email,
            subject: 'Your Masidy journey payment is confirmed',
            html: `<h1>Payment confirmed</h1><p>Your booking reference is ${session.metadata?.orderReference ?? 'available in your dashboard'}.</p><p>Open your Masidy dashboard for the voucher and travel-readiness checklist.</p>`,
          }).catch(() => undefined)
        }
        const departureId = session.metadata?.departureId
        if (departureId) {
          const departure = await payload.findByID({
            collection: 'departures',
            id: departureId,
            overrideAccess: true,
          })
          const reminderDate = new Date(departure.startDate)
          reminderDate.setUTCDate(reminderDate.getUTCDate() - 7)
          await payload.create({
            collection: 'notifications',
            overrideAccess: true,
            draft: false,
            data: {
              recipient: session.metadata.userId,
              type: 'reminder',
              title: 'Your journey starts in one week',
              body: 'Review traveler documents, meeting details, and emergency contacts before departure.',
              href: '/dashboard/operations',
              scheduledFor: reminderDate.toISOString(),
              deliveryStatus: 'scheduled',
              attempts: 0,
            },
          })
        }
      }
      const holdId = session.metadata?.holdId
      if (holdId && session.payment_status === 'paid') {
        const hold = await payload.findByID({
          collection: 'reservation-holds',
          id: holdId,
          overrideAccess: true,
        })
        if (hold.status === 'active') {
          const departureID =
            typeof hold.departure === 'string' ? hold.departure : hold.departure.id
          const departure = await payload.findByID({
            collection: 'departures',
            id: departureID,
            overrideAccess: true,
          })
          await payload.update({
            collection: 'departures',
            id: departureID,
            overrideAccess: true,
            data: {
              booked: Math.min(departure.capacity, departure.booked + hold.seats),
            },
          })
          await payload.update({
            collection: 'reservation-holds',
            id: hold.id,
            overrideAccess: true,
            data: { status: 'converted' },
          })
        }
      }
    }
  } else if (event.type === 'account.updated') {
    const account = event.data.object
    const payload = await getPayloadClient()
    const records = await payload.find({
      collection: 'payment-accounts',
      where: { stripeAccountId: { equals: account.id } },
      limit: 1,
      overrideAccess: true,
    })
    if (records.docs[0]) {
      await payload.update({
        collection: 'payment-accounts',
        id: records.docs[0].id,
        overrideAccess: true,
        data: {
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted,
          status:
            account.charges_enabled && account.payouts_enabled
              ? 'enabled'
              : account.requirements?.disabled_reason
                ? 'restricted'
                : 'pending',
        },
      })
    }
  } else if (
    event.type === 'payout.paid' ||
    event.type === 'payout.failed' ||
    event.type === 'payout.canceled'
  ) {
    const payout = event.data.object
    const connectedAccount = event.account
    if (connectedAccount) {
      const payload = await getPayloadClient()
      const accounts = await payload.find({
        collection: 'payment-accounts',
        where: { stripeAccountId: { equals: connectedAccount } },
        limit: 1,
        overrideAccess: true,
      })
      const account = accounts.docs[0]
      if (account) {
        const existing = await payload.find({
          collection: 'payout-statements',
          where: { stripePayoutId: { equals: payout.id } },
          limit: 1,
          overrideAccess: true,
        })
        const data = {
          user: typeof account.user === 'string' ? account.user : account.user?.id,
          agency: typeof account.agency === 'string' ? account.agency : account.agency?.id,
          stripePayoutId: payout.id,
          amount: payout.amount / 100,
          currency: payout.currency.toUpperCase(),
          arrivalDate: new Date(payout.arrival_date * 1000).toISOString(),
          status:
            event.type === 'payout.paid'
              ? 'paid'
              : event.type === 'payout.failed'
                ? 'failed'
                : 'cancelled',
          failureMessage: payout.failure_message ?? undefined,
        } as const
        if (existing.docs[0]) {
          await payload.update({
            collection: 'payout-statements',
            id: existing.docs[0].id,
            overrideAccess: true,
            data,
          })
        } else {
          await payload.create({
            collection: 'payout-statements',
            overrideAccess: true,
            draft: false,
            data,
          })
        }
      }
    }
  } else if (
    event.type === 'charge.dispute.created' ||
    event.type === 'charge.dispute.updated' ||
    event.type === 'charge.dispute.closed'
  ) {
    const dispute = event.data.object
    const paymentIntentID =
      typeof dispute.payment_intent === 'string'
        ? dispute.payment_intent
        : dispute.payment_intent?.id
    if (paymentIntentID) {
      const payload = await getPayloadClient()
      const orders = await payload.find({
        collection: 'orders',
        where: { stripePaymentIntentId: { equals: paymentIntentID } },
        limit: 1,
        overrideAccess: true,
      })
      const order = orders.docs[0]
      if (order) {
        const existing = await payload.find({
          collection: 'disputes',
          where: { stripeDisputeId: { equals: dispute.id } },
          limit: 1,
          overrideAccess: true,
        })
        const data = {
          order: order.id,
          customer: typeof order.traveler === 'string' ? order.traveler : order.traveler.id,
          stripeDisputeId: dispute.id,
          amount: dispute.amount / 100,
          currency: dispute.currency.toUpperCase(),
          reason: dispute.reason,
          status: dispute.status,
          evidenceDueAt: dispute.evidence_details?.due_by
            ? new Date(dispute.evidence_details.due_by * 1000).toISOString()
            : undefined,
        }
        if (existing.docs[0]) {
          await payload.update({
            collection: 'disputes',
            id: existing.docs[0].id,
            overrideAccess: true,
            data,
          })
        } else {
          await payload.create({
            collection: 'disputes',
            overrideAccess: true,
            draft: false,
            data,
          })
        }
      }
    }
  }

  return new Response('ok')
}
