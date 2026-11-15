import { revalidateTag } from 'next/cache'
import type { Access, CollectionBeforeValidateHook, CollectionConfig, Where } from 'payload'

const ownOrApproved: Access = ({ req }) => {
  if (req.user?.collection === 'admins') return true
  if (req.user?.collection === 'users') {
    return {
      or: [{ status: { equals: 'approved' } }, { author: { equals: req.user.id } }],
    } as Where
  }
  return { status: { equals: 'approved' } }
}

const assignAuthor: CollectionBeforeValidateHook = ({ data, operation, req }) =>
  operation === 'create' && req.user?.collection === 'users'
    ? { ...data, author: req.user.id, status: 'pending' }
    : data

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  admin: {
    group: 'Trust & Onboarding',
    useAsTitle: 'title',
    defaultColumns: ['title', 'trip', 'author', 'rating', 'status'],
  },
  access: {
    create: ({ req }) => req.user?.collection === 'users',
    delete: ({ req }) => req.user?.collection === 'admins',
    read: ownOrApproved,
    update: ({ req }) => req.user?.collection === 'admins',
  },
  hooks: {
    beforeValidate: [assignAuthor],
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
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      access: {
        create: ({ req }) => req.user?.collection === 'admins',
        update: ({ req }) => req.user?.collection === 'admins',
      },
    },
    {
      name: 'trip',
      type: 'relationship',
      relationTo: 'trips',
      required: true,
      index: true,
    },
    { name: 'order', type: 'relationship', relationTo: 'orders' },
    { name: 'title', type: 'text', required: true, maxLength: 140 },
    { name: 'body', type: 'textarea', required: true, maxLength: 3000 },
    { name: 'rating', type: 'number', required: true, min: 1, max: 5 },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
      access: {
        create: ({ req }) => req.user?.collection === 'admins',
        update: ({ req }) => req.user?.collection === 'admins',
      },
    },
  ],
}
