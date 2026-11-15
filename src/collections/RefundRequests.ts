import { getStripeClient } from '@/lib/stripe'
import { auditChanges, auditDeletes } from '@/lib/audit-hook'
import type {
  Access,
  CollectionAfterChangeHook,
  CollectionBeforeValidateHook,
  CollectionConfig,
} from 'payload'

const ownRefunds: Access = ({ req }) => {
  if (req.user?.collection === 'admins') return true
  if (req.user?.collection !== 'users') return false
  return { requester: { equals: req.user.id } }
}

const prepareRefund: CollectionBeforeValidateHook = async ({ data, operation, req }) => {
  if (operation !== 'create' || req.user?.collection !== 'users') return data
  const orderID = typeof data?.order === 'string' ? data.order : data?.order?.id
  const order = await req.payload.findByID({
    collection: 'orders',
    id: orderID,
    user: req.user,
    overrideAccess: false,
  })
  if (!['paid', 'confirmed', 'completed'].includes(order.status)) {
    throw new Error('Only paid orders can be refunded.')
  }
  const amount = Number(data?.amount)
  if (!Number.isFinite(amount) || amount <= 0 || amount > order.total) {
    throw new Error('Choose a valid refund amount.')
  }
  return { ...data, requester: req.user.id, status: 'requested' }
}

const processApprovedRefund: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  if (doc.status !== 'approved' || previousDoc?.status === 'approved') return doc
  const stripe = getStripeClient()
  if (!stripe) throw new Error('Stripe is not configured.')
  const orderID = typeof doc.order === 'string' ? doc.order : doc.order.id
  const order = await req.payload.findByID({
    collection: 'orders',
    id: orderID,
    overrideAccess: true,
  })
  if (!order.stripePaymentIntentId) throw new Error('Order has no Stripe payment.')
  try {
    const refund = await stripe.refunds.create(
      {
        payment_intent: order.stripePaymentIntentId,
        amount: Math.round(doc.amount * 100),
        reason: 'requested_by_customer',
        metadata: { orderId: String(order.id), refundRequestId: String(doc.id) },
      },
      { idempotencyKey: `refund:${doc.id}` },
    )
    await req.payload.update({
      collection: 'refund-requests',
      id: doc.id,
      overrideAccess: true,
      data: { status: 'processed', stripeRefundId: refund.id },
    })
    await req.payload.create({
      collection: 'ledger-entries',
      overrideAccess: true,
      draft: false,
      data: {
        order: order.id,
        user: typeof order.traveler === 'string' ? order.traveler : order.traveler.id,
        type: 'refund',
        amount: -doc.amount,
        currency: order.currency,
        note: `Refund ${refund.id}`,
      },
    })
    if (doc.amount >= order.total) {
      await req.payload.update({
        collection: 'orders',
        id: order.id,
        overrideAccess: true,
        data: { status: 'refunded' },
      })
    }
  } catch {
    await req.payload.update({
      collection: 'refund-requests',
      id: doc.id,
      overrideAccess: true,
      data: { status: 'failed' },
    })
  }
  return doc
}

export const RefundRequests: CollectionConfig = {
  slug: 'refund-requests',
  admin: { group: 'Finance', useAsTitle: 'id' },
  access: {
    create: ({ req }) => req.user?.collection === 'users',
    delete: ({ req }) => req.user?.collection === 'admins',
    read: ownRefunds,
    update: ({ req }) => req.user?.collection === 'admins',
  },
  hooks: {
    beforeValidate: [prepareRefund],
    afterChange: [processApprovedRefund, auditChanges('refund-requests')],
    afterDelete: [auditDeletes('refund-requests')],
  },
  fields: [
    { name: 'order', type: 'relationship', relationTo: 'orders', required: true, index: true },
    { name: 'requester', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'amount', type: 'number', required: true, min: 0.01 },
    { name: 'reason', type: 'textarea', required: true, maxLength: 3000 },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'requested',
      options: ['requested', 'reviewing', 'approved', 'declined', 'processed', 'failed'],
    },
    { name: 'stripeRefundId', type: 'text', index: true },
    { name: 'resolution', type: 'textarea', maxLength: 3000 },
  ],
}
