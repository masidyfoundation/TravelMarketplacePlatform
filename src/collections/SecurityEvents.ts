import type { CollectionConfig } from 'payload'

export const SecurityEvents: CollectionConfig = {
  slug: 'security-events',
  admin: { group: 'Trust & Onboarding', useAsTitle: 'type' },
  access: {
    create: ({ req }) => req.user?.collection === 'admins',
    delete: ({ req }) => req.user?.collection === 'admins',
    read: ({ req }) => req.user?.collection === 'admins',
    update: ({ req }) => req.user?.collection === 'admins',
  },
  fields: [
    { name: 'type', type: 'text', required: true, index: true },
    { name: 'severity', type: 'select', required: true, options: ['info', 'warning', 'critical'] },
    { name: 'user', type: 'relationship', relationTo: 'users' },
    { name: 'route', type: 'text' },
    { name: 'details', type: 'json' },
    { name: 'resolvedAt', type: 'date' },
  ],
}
