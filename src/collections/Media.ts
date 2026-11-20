import type { Access, CollectionBeforeValidateHook, CollectionConfig } from 'payload'
import { revalidateTag } from 'next/cache'

import { createFolderField, createTagField } from 'payload'

const mediaOwnerAccess: Access = ({ req }) => {
  if (req.user?.collection === 'admins') return true
  if (req.user?.collection !== 'users') return false
  return { owner: { equals: req.user.id } }
}

const assignMediaOwner: CollectionBeforeValidateHook = ({ data, operation, req }) =>
  operation === 'create' && req.user?.collection === 'users'
    ? { ...data, owner: req.user.id }
    : data

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    create: ({ req }) =>
      req.user?.collection === 'admins' ||
      (req.user?.collection === 'users' && ['agent', 'agency'].includes(req.user.role)),
    delete: mediaOwnerAccess,
    read: () => true,
    update: mediaOwnerAccess,
  },
  hooks: {
    beforeValidate: [assignMediaOwner],
    afterChange: [
      ({ doc }) => {
        revalidateTag('marketplace', 'max')
        return doc
      },
    ],
    afterDelete: [
      ({ doc }) => {
        revalidateTag('marketplace', 'max')
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      admin: { position: 'sidebar' },
      access: {
        create: ({ req }) => req.user?.collection === 'admins',
        update: ({ req }) => req.user?.collection === 'admins',
      },
    },
    createFolderField({ relationTo: 'folders' }),
    createTagField({ relationTo: 'tags' }),
  ],
  upload: true,
}
