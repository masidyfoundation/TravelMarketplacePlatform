import type { CollectionConfig } from 'payload'

export const AuditLogs: CollectionConfig = {
  slug: 'audit-logs',
  admin: { group: 'Trust & Onboarding', useAsTitle: 'action' },
  access: {
    create: ({ req }) => req.user?.collection === 'admins',
    delete: () => false,
    read: ({ req }) => req.user?.collection === 'admins',
    update: () => false,
  },
  fields: [
    { name: 'actor', type: 'relationship', relationTo: ['admins', 'users'] },
    { name: 'action', type: 'text', required: true, index: true },
    { name: 'collectionName', type: 'text', required: true },
    { name: 'documentId', type: 'text' },
    { name: 'metadata', type: 'json' },
    { name: 'ipHash', type: 'text' },
  ],
}
