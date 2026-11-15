import type { Access, CollectionConfig } from 'payload'

const ownDisputes: Access = ({ req }) => {
  if (req.user?.collection === 'admins') return true
  if (req.user?.collection !== 'users') return false
  return { customer: { equals: req.user.id } }
}

export const Disputes: CollectionConfig = {
  slug: 'disputes',
  admin: { group: 'Finance', useAsTitle: 'stripeDisputeId' },
  access: {
    create: ({ req }) => req.user?.collection === 'admins',
    delete: ({ req }) => req.user?.collection === 'admins',
    read: ownDisputes,
    update: ({ req }) => req.user?.collection === 'admins',
  },
  fields: [
    { name: 'order', type: 'relationship', relationTo: 'orders', required: true, index: true },
    { name: 'customer', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'stripeDisputeId', type: 'text', required: true, unique: true, index: true },
    { name: 'amount', type: 'number', required: true },
    { name: 'currency', type: 'text', required: true },
    { name: 'reason', type: 'text' },
    { name: 'status', type: 'text', required: true },
    { name: 'evidenceDueAt', type: 'date' },
  ],
}
