import type { Access, CollectionBeforeValidateHook, CollectionConfig } from 'payload'
import { auditChanges, auditDeletes } from '@/lib/audit-hook'

const ownRequests: Access = ({ req }) => {
  if (req.user?.collection === 'admins') return true
  if (req.user?.collection !== 'users') return false
  return { owner: { equals: req.user.id } }
}

const prepareRequest: CollectionBeforeValidateHook = ({ data, operation, req }) =>
  operation === 'create' && req.user?.collection === 'users'
    ? { ...data, owner: req.user.id, status: 'requested' }
    : data

export const DataRequests: CollectionConfig = {
  slug: 'data-requests',
  admin: { group: 'Trust & Onboarding', useAsTitle: 'id' },
  access: {
    create: ({ req }) => req.user?.collection === 'users',
    delete: ({ req }) => req.user?.collection === 'admins',
    read: ownRequests,
    update: ({ req }) => req.user?.collection === 'admins',
  },
  hooks: {
    beforeValidate: [prepareRequest],
    afterChange: [auditChanges('data-requests')],
    afterDelete: [auditDeletes('data-requests')],
  },
  fields: [
    { name: 'owner', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'type', type: 'select', required: true, options: ['export', 'deletion', 'correction'] },
    { name: 'reason', type: 'textarea', maxLength: 3000 },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'requested',
      options: ['requested', 'identity-check', 'processing', 'completed', 'declined'],
    },
    { name: 'completedAt', type: 'date' },
    { name: 'resolution', type: 'textarea', maxLength: 3000 },
  ],
}
