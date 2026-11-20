import { randomUUID } from 'node:crypto'
import type {
  Access,
  CollectionBeforeValidateHook,
  CollectionConfig,
  FieldAccess,
  Where,
} from 'payload'
import { auditChanges, auditDeletes } from '@/lib/audit-hook'

const ownOrders: Access = async ({ req }) => {
  if (req.user?.collection === 'admins') return true
  if (req.user?.collection !== 'users') return false
  if (req.user.role === 'agency') {
    const memberships = await req.payload.find({
      collection: 'agency-memberships',
      where: {
        and: [{ user: { equals: req.user.id } }, { status: { equals: 'active' } }],
      },
      limit: 100,
      overrideAccess: true,
    })
    const agencyIDs = memberships.docs.map((membership) =>
      typeof membership.agency === 'string' ? membership.agency : membership.agency.id,
    )
    return agencyIDs.length > 0 ? { agency: { in: agencyIDs } } : false
  }
  return {
    or: [{ traveler: { equals: req.user.id } }, { agent: { equals: req.user.id } }],
  } as Where
}

const adminsOnly: Access = ({ req }) => req.user?.collection === 'admins'
const adminsOnlyField: FieldAccess = ({ req }) => req.user?.collection === 'admins'

const prepareOrder: CollectionBeforeValidateHook = async ({ data, operation, req }) => {
  if (operation !== 'create' || req.user?.collection !== 'users') return data
  const tripID =
    typeof data?.trip === 'string'
      ? data.trip
      : typeof data?.trip === 'object' && data.trip
        ? data.trip.id
        : null
  const travelers = Number(data?.travelers)
  if (!tripID || !Number.isInteger(travelers) || travelers < 1 || travelers > 20) {
    throw new Error('Choose a valid journey and traveler count.')
  }
  const trip = await req.payload.findByID({
    collection: 'trips',
    id: tripID,
    overrideAccess: false,
    req,
  })
  if (trip.status !== 'active') throw new Error('This journey is not currently bookable.')
  const agencyID = typeof trip.agency === 'string' ? trip.agency : trip.agency.id
  const subtotal = trip.price * travelers
  const rules = await req.payload.find({
    collection: 'finance-rules',
    where: { active: { equals: true } },
    limit: 2,
    overrideAccess: true,
  })
  const financeRule = rules.docs[0]
  if (!financeRule || rules.totalDocs !== 1) {
    throw new Error('Checkout requires exactly one active finance rule.')
  }
  if (!financeRule.supportedCurrencies.includes(trip.currency)) {
    throw new Error('This journey currency is not enabled for checkout.')
  }
  const platformFeePercent = financeRule.platformFeePercent
  const taxPercent = financeRule.taxPercent
  const taxAmount = Math.round(subtotal * (taxPercent / 100) * 100) / 100
  const total = subtotal + taxAmount
  const attributionAgentID =
    typeof req.context?.attributionAgentID === 'string' ? req.context.attributionAgentID : undefined
  const commissionRate = attributionAgentID ? trip.agentCommission : 0
  return {
    ...data,
    reference: `MSD-${randomUUID().slice(0, 8).toUpperCase()}`,
    traveler: req.user.id,
    agency: agencyID,
    total,
    currency: trip.currency,
    agent: attributionAgentID,
    agentCommissionAmount: Math.round(total * (commissionRate / 100) * 100) / 100,
    subtotal,
    taxAmount,
    platformFeeAmount: Math.round(subtotal * (platformFeePercent / 100) * 100) / 100,
    invoicePrefix: financeRule.invoicePrefix,
    status: 'pending',
  }
}

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    group: 'Operations',
    useAsTitle: 'reference',
    defaultColumns: ['reference', 'trip', 'traveler', 'total', 'status'],
  },
  access: {
    create: ({ req }) =>
      req.user?.collection === 'users' && req.context?.checkout === true,
    delete: adminsOnly,
    read: ownOrders,
    update: ownOrders,
  },
  hooks: {
    beforeValidate: [prepareOrder],
    afterChange: [auditChanges('orders')],
    afterDelete: [auditDeletes('orders')],
  },
  fields: [
    {
      name: 'reference',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      access: { create: adminsOnlyField, update: adminsOnlyField },
    },
    {
      name: 'traveler',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      access: { create: adminsOnlyField, update: adminsOnlyField },
    },
    {
      name: 'agent',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      access: { create: adminsOnlyField, update: adminsOnlyField },
    },
    {
      name: 'agency',
      type: 'relationship',
      relationTo: 'agencies',
      required: true,
      index: true,
      access: { create: adminsOnlyField, update: adminsOnlyField },
    },
    {
      name: 'trip',
      type: 'relationship',
      relationTo: 'trips',
      required: true,
      index: true,
      access: { update: adminsOnlyField },
    },
    {
      name: 'departure',
      type: 'relationship',
      relationTo: 'departures',
      index: true,
      access: { update: adminsOnlyField },
    },
    {
      name: 'travelers',
      type: 'number',
      required: true,
      min: 1,
      max: 20,
      access: { update: adminsOnlyField },
    },
    {
      name: 'total',
      type: 'number',
      required: true,
      min: 0,
      access: { create: adminsOnlyField, update: adminsOnlyField },
    },
    {
      name: 'subtotal',
      type: 'number',
      min: 0,
      access: { create: adminsOnlyField, update: adminsOnlyField },
    },
    {
      name: 'taxAmount',
      type: 'number',
      min: 0,
      access: { create: adminsOnlyField, update: adminsOnlyField },
    },
    {
      name: 'currency',
      type: 'select',
      required: true,
      options: ['USD', 'EUR', 'GBP', 'AED'],
      access: { create: adminsOnlyField, update: adminsOnlyField },
    },
    {
      name: 'agentCommissionAmount',
      type: 'number',
      min: 0,
      access: { create: adminsOnlyField, update: adminsOnlyField },
    },
    {
      name: 'platformFeeAmount',
      type: 'number',
      min: 0,
      access: { create: adminsOnlyField, update: adminsOnlyField },
    },
    {
      name: 'invoicePrefix',
      type: 'text',
      maxLength: 20,
      access: { create: adminsOnlyField, update: adminsOnlyField },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      access: { create: adminsOnlyField, update: adminsOnlyField },
      options: [
        { label: 'Pending payment', value: 'pending' },
        { label: 'Paid', value: 'paid' },
        { label: 'Confirmed', value: 'confirmed' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'Refunded', value: 'refunded' },
      ],
    },
    {
      name: 'stripeCheckoutSessionId',
      type: 'text',
      index: true,
      access: { create: adminsOnlyField, update: adminsOnlyField },
    },
    {
      name: 'stripePaymentIntentId',
      type: 'text',
      index: true,
      access: { create: adminsOnlyField, update: adminsOnlyField },
    },
    {
      name: 'paidAt',
      type: 'date',
      access: { create: adminsOnlyField, update: adminsOnlyField },
    },
    {
      name: 'voucherCode',
      type: 'text',
      index: true,
      access: { create: adminsOnlyField, update: adminsOnlyField },
    },
    {
      name: 'voucherIssuedAt',
      type: 'date',
      access: { create: adminsOnlyField, update: adminsOnlyField },
    },
  ],
}
