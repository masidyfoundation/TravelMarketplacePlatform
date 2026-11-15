import type { Access, CollectionBeforeValidateHook, CollectionConfig } from 'payload'

const ownConsents: Access = ({ req }) => {
  if (req.user?.collection === 'admins') return true
  if (req.user?.collection !== 'users') return false
  return { owner: { equals: req.user.id } }
}

const prepareConsent: CollectionBeforeValidateHook = ({ data, operation, req }) =>
  operation === 'create' && req.user?.collection === 'users'
    ? { ...data, owner: req.user.id, recordedAt: new Date().toISOString() }
    : data

export const Consents: CollectionConfig = {
  slug: 'consents',
  admin: { group: 'Trust & Onboarding', useAsTitle: 'type' },
  access: {
    create: ({ req }) => req.user?.collection === 'users',
    delete: ({ req }) => req.user?.collection === 'admins',
    read: ownConsents,
    update: ownConsents,
  },
  hooks: { beforeValidate: [prepareConsent] },
  fields: [
    { name: 'owner', type: 'relationship', relationTo: 'users', required: true, index: true },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: ['terms', 'privacy', 'marketing', 'analytics'],
    },
    { name: 'policyVersion', type: 'text', required: true },
    { name: 'granted', type: 'checkbox', required: true },
    { name: 'recordedAt', type: 'date', required: true },
  ],
}
