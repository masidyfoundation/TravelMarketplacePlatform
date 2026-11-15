import type { CollectionConfig } from 'payload'

export const FinanceRules: CollectionConfig = {
  slug: 'finance-rules',
  admin: { group: 'Finance', useAsTitle: 'name' },
  access: {
    create: ({ req }) => req.user?.collection === 'admins',
    delete: ({ req }) => req.user?.collection === 'admins',
    read: ({ req }) => req.user?.collection === 'admins',
    update: ({ req }) => req.user?.collection === 'admins',
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'active', type: 'checkbox', required: true, defaultValue: false, index: true },
    { name: 'platformFeePercent', type: 'number', required: true, min: 0, max: 50 },
    { name: 'taxPercent', type: 'number', required: true, min: 0, max: 100 },
    {
      name: 'supportedCurrencies',
      type: 'select',
      hasMany: true,
      required: true,
      options: ['USD', 'EUR', 'GBP', 'AED'],
    },
    { name: 'invoicePrefix', type: 'text', required: true, maxLength: 20 },
    { name: 'refundWindowDays', type: 'number', required: true, min: 0, max: 365 },
    { name: 'termsNote', type: 'textarea', maxLength: 3000 },
  ],
}
