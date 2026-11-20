import type {
  Access,
  CollectionBeforeValidateHook,
  CollectionConfig,
  FieldAccess,
  Where,
} from 'payload'
import { auditChanges, auditDeletes } from '@/lib/audit-hook'

const serverManagedField: FieldAccess = ({ req }) =>
  req.user?.collection === 'admins' || req.context?.stripeConnect === true

const ownAccounts: Access = async ({ req }) => {
  if (req.user?.collection === 'admins') return true
  if (req.user?.collection !== 'users') return false
  const memberships = await req.payload.find({
    collection: 'agency-memberships',
    where: { and: [{ user: { equals: req.user.id } }, { status: { equals: 'active' } }] },
    limit: 100,
    overrideAccess: true,
  })
  const agencies = memberships.docs.map((membership) =>
    typeof membership.agency === 'string' ? membership.agency : membership.agency.id,
  )
  return {
    or: [
      { user: { equals: req.user.id } },
      ...(agencies.length > 0 ? [{ agency: { in: agencies } }] : []),
    ],
  } as Where
}

const validateOwner: CollectionBeforeValidateHook = async ({ data, operation, req }) => {
  if (operation !== 'create' || req.user?.collection !== 'users') return data
  if (req.user.role === 'agent') return { ...data, user: req.user.id, type: 'agent' }
  if (req.user.role === 'agency' && data?.agency) {
    const agencyID = typeof data.agency === 'string' ? data.agency : data.agency.id
    const membership = await req.payload.find({
      collection: 'agency-memberships',
      where: {
        and: [
          { user: { equals: req.user.id } },
          { agency: { equals: agencyID } },
          { status: { equals: 'active' } },
        ],
      },
      limit: 1,
      overrideAccess: true,
    })
    if (membership.totalDocs > 0) return { ...data, type: 'agency' }
  }
  throw new Error('A verified partner account is required.')
}

export const PaymentAccounts: CollectionConfig = {
  slug: 'payment-accounts',
  admin: { group: 'Finance', useAsTitle: 'stripeAccountId' },
  access: {
    create: ({ req }) =>
      req.user?.collection === 'users' && ['agent', 'agency'].includes(req.user.role),
    delete: ({ req }) => req.user?.collection === 'admins',
    read: ownAccounts,
    update: ownAccounts,
  },
  hooks: {
    beforeValidate: [validateOwner],
    afterChange: [auditChanges('payment-accounts')],
    afterDelete: [auditDeletes('payment-accounts')],
  },
  fields: [
    {
      name: 'type',
      type: 'select',
      required: true,
      options: ['agent', 'agency'],
      access: { create: serverManagedField, update: serverManagedField },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      access: { create: serverManagedField, update: serverManagedField },
    },
    {
      name: 'agency',
      type: 'relationship',
      relationTo: 'agencies',
      index: true,
      access: { create: serverManagedField, update: serverManagedField },
    },
    {
      name: 'stripeAccountId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      access: { create: serverManagedField, update: serverManagedField },
    },
    {
      name: 'chargesEnabled',
      type: 'checkbox',
      defaultValue: false,
      access: { create: serverManagedField, update: serverManagedField },
    },
    {
      name: 'payoutsEnabled',
      type: 'checkbox',
      defaultValue: false,
      access: { create: serverManagedField, update: serverManagedField },
    },
    {
      name: 'detailsSubmitted',
      type: 'checkbox',
      defaultValue: false,
      access: { create: serverManagedField, update: serverManagedField },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: ['pending', 'enabled', 'restricted', 'disabled'],
      access: { create: serverManagedField, update: serverManagedField },
    },
  ],
}
