import type { CollectionConfig } from 'payload'

export const RateLimits: CollectionConfig = {
  slug: 'rate-limits',
  admin: { hidden: true },
  access: {
    create: () => false,
    delete: () => false,
    read: () => false,
    update: () => false,
  },
  fields: [
    { name: 'key', type: 'text', required: true, unique: true, index: true },
    { name: 'count', type: 'number', required: true, defaultValue: 1 },
    { name: 'windowStartedAt', type: 'date', required: true },
    { name: 'expiresAt', type: 'date', required: true, index: true },
  ],
}
