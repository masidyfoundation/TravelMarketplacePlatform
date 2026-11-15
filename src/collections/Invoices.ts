import type { Access, CollectionConfig } from 'payload'

const ownInvoices: Access = ({ req }) => {
  if (req.user?.collection === 'admins') return true
  if (req.user?.collection !== 'users') return false
  return { customer: { equals: req.user.id } }
}

export const Invoices: CollectionConfig = {
  slug: 'invoices',
  admin: { group: 'Finance', useAsTitle: 'number' },
  access: {
    create: ({ req }) => req.user?.collection === 'admins',
    delete: ({ req }) => req.user?.collection === 'admins',
    read: ownInvoices,
    update: ({ req }) => req.user?.collection === 'admins',
  },
  fields: [
    { name: 'number', type: 'text', required: true, unique: true, index: true },
    { name: 'order', type: 'relationship', relationTo: 'orders', required: true, unique: true },
    { name: 'customer', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'subtotal', type: 'number', required: true, min: 0 },
    { name: 'tax', type: 'number', required: true, min: 0 },
    { name: 'total', type: 'number', required: true, min: 0 },
    { name: 'currency', type: 'select', required: true, options: ['USD', 'EUR', 'GBP', 'AED'] },
    { name: 'issuedAt', type: 'date', required: true },
    { name: 'status', type: 'select', required: true, options: ['paid', 'refunded', 'void'] },
  ],
}
