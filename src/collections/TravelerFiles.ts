import type { Access, CollectionBeforeValidateHook, CollectionConfig } from 'payload'

const ownFiles: Access = ({ req }) => {
  if (req.user?.collection === 'admins') return true
  if (req.user?.collection !== 'users') return false
  return { owner: { equals: req.user.id } }
}

const assignOwner: CollectionBeforeValidateHook = ({ data, operation, req }) =>
  operation === 'create' && req.user?.collection === 'users'
    ? { ...data, owner: req.user.id }
    : data

export const TravelerFiles: CollectionConfig = {
  slug: 'traveler-files',
  admin: { group: 'Operations', useAsTitle: 'label' },
  access: {
    create: ({ req }) => req.user?.collection === 'users',
    delete: ownFiles,
    read: ownFiles,
    update: ownFiles,
  },
  hooks: { beforeValidate: [assignOwner] },
  upload: {
    mimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
  },
  fields: [
    { name: 'owner', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'label', type: 'text', required: true, maxLength: 160 },
    {
      name: 'documentType',
      type: 'select',
      required: true,
      options: ['passport', 'visa', 'insurance', 'medical', 'other'],
    },
    { name: 'expiresAt', type: 'date' },
  ],
}
