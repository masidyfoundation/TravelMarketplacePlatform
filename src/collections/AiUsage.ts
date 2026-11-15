import type { Access, CollectionConfig } from 'payload'

const ownUsage: Access = ({ req }) => {
  if (req.user?.collection === 'admins') return true
  if (req.user?.collection !== 'users') return false
  return { owner: { equals: req.user.id } }
}

export const AiUsage: CollectionConfig = {
  slug: 'ai-usage',
  admin: { group: 'Workspace', useAsTitle: 'id' },
  access: {
    create: ({ req }) => req.user?.collection === 'admins',
    delete: ({ req }) => req.user?.collection === 'admins',
    read: ownUsage,
    update: ({ req }) => req.user?.collection === 'admins',
  },
  fields: [
    { name: 'owner', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'project', type: 'relationship', relationTo: 'ai-projects' },
    { name: 'model', type: 'text', required: true },
    { name: 'inputTokens', type: 'number', min: 0 },
    { name: 'outputTokens', type: 'number', min: 0 },
    { name: 'estimatedCostUsd', type: 'number', min: 0 },
    { name: 'moderationFlagged', type: 'checkbox', defaultValue: false },
    { name: 'status', type: 'select', required: true, options: ['completed', 'blocked', 'failed'] },
  ],
}
