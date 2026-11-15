import { revalidateTag } from 'next/cache'
import type { Access, CollectionBeforeValidateHook, CollectionConfig, Where } from 'payload'

const ownOrPublished: Access = ({ req }) => {
  if (req.user?.collection === 'admins') return true
  if (req.user?.collection === 'users' && req.user.role === 'agent') {
    return {
      or: [{ status: { equals: 'published' } }, { owner: { equals: req.user.id } }],
    } as Where
  }
  return { status: { equals: 'published' } }
}

const ownProfiles: Access = ({ req }) => {
  if (req.user?.collection === 'admins') return true
  if (req.user?.collection !== 'users' || req.user.role !== 'agent') return false
  return { owner: { equals: req.user.id } }
}

const prepareProfile: CollectionBeforeValidateHook = ({ data, operation, req }) => {
  if (operation === 'create' && req.user?.collection === 'users' && req.user.role === 'agent') {
    return { ...data, owner: req.user.id }
  }
  return data
}

export const AgentProfiles: CollectionConfig = {
  slug: 'agent-profiles',
  admin: {
    group: 'Marketplace',
    useAsTitle: 'displayName',
    defaultColumns: ['displayName', 'slug', 'owner', 'status', 'updatedAt'],
  },
  access: {
    create: ({ req }) =>
      req.user?.collection === 'admins' ||
      (req.user?.collection === 'users' && req.user.role === 'agent'),
    delete: ownProfiles,
    read: ownOrPublished,
    update: ownProfiles,
  },
  hooks: {
    beforeValidate: [prepareProfile],
    afterChange: [
      ({ doc, previousDoc }) => {
        revalidateTag('agent-storefronts', 'max')
        if (doc.slug) revalidateTag(`agent:${doc.slug}`, 'max')
        if (previousDoc?.slug && previousDoc.slug !== doc.slug) {
          revalidateTag(`agent:${previousDoc.slug}`, 'max')
        }
        return doc
      },
    ],
    afterDelete: [
      ({ doc }) => {
        revalidateTag('agent-storefronts', 'max')
        if (doc.slug) revalidateTag(`agent:${doc.slug}`, 'max')
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      unique: true,
      index: true,
      access: {
        create: ({ req }) => req.user?.collection === 'admins',
        update: ({ req }) => req.user?.collection === 'admins',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      maxLength: 80,
    },
    { name: 'displayName', type: 'text', required: true, maxLength: 120 },
    { name: 'tagline', type: 'text', required: true, maxLength: 180 },
    { name: 'bio', type: 'textarea', required: true, maxLength: 3000 },
    { name: 'location', type: 'text', maxLength: 160 },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'specialties',
      type: 'array',
      maxRows: 10,
      fields: [{ name: 'name', type: 'text', required: true }],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
    },
  ],
}
