import type { Access, CollectionBeforeValidateHook, CollectionConfig } from 'payload'

const ownKits: Access = ({ req }) => {
  if (req.user?.collection === 'admins') return true
  if (req.user?.collection !== 'users') return false
  return { owner: { equals: req.user.id } }
}

const assignOwner: CollectionBeforeValidateHook = ({ data, operation, req }) =>
  operation === 'create' && req.user?.collection === 'users'
    ? { ...data, owner: req.user.id }
    : data

export const BrandKits: CollectionConfig = {
  slug: 'brand-kits',
  admin: { group: 'Workspace', useAsTitle: 'name' },
  access: {
    create: ({ req }) => req.user?.collection === 'users',
    delete: ownKits,
    read: ownKits,
    update: ownKits,
  },
  hooks: { beforeValidate: [assignOwner] },
  fields: [
    { name: 'owner', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'name', type: 'text', required: true, maxLength: 120 },
    { name: 'primaryColor', type: 'text', required: true, defaultValue: '#0b2e4a' },
    { name: 'accentColor', type: 'text', required: true, defaultValue: '#ff654c' },
    { name: 'tone', type: 'text', required: true, maxLength: 500 },
    { name: 'logo', type: 'upload', relationTo: 'media' },
  ],
}
