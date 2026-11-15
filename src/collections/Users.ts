import type { Access, CollectionConfig } from 'payload'

const isAdmin = ({ req }: Parameters<Access>[0]) => req.user?.collection === 'admins'

const isSelfOrAdmin: Access = ({ req }) => {
  if (req.user?.collection === 'admins') return true
  if (req.user?.collection !== 'users') return false
  return { id: { equals: req.user.id } }
}

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    disableLocalStrategy: true,
  },
  admin: {
    hidden: true,
    useAsTitle: 'name',
  },
  access: {
    admin: isAdmin,
    create: () => false,
    delete: isSelfOrAdmin,
    read: isSelfOrAdmin,
    update: isSelfOrAdmin,
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'traveler',
      access: {
        create: ({ req }) => req.user?.collection === 'admins',
        update: ({ req }) => req.user?.collection === 'admins',
      },
      options: [
        { label: 'Traveler', value: 'traveler' },
        { label: 'Travel agent', value: 'agent' },
        { label: 'Agency operator', value: 'agency' },
      ],
    },
    {
      name: 'image',
      type: 'text',
    },
    {
      name: 'emailVerified',
      type: 'date',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Pending review', value: 'pending' },
        { label: 'Suspended', value: 'suspended' },
      ],
      access: {
        create: ({ req }) => req.user?.collection === 'admins',
        update: ({ req }) => req.user?.collection === 'admins',
      },
    },
    {
      name: 'phone',
      type: 'text',
    },
    {
      name: 'country',
      type: 'text',
    },
    {
      name: 'locale',
      type: 'select',
      defaultValue: 'en',
      options: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ar', 'ja'],
    },
    {
      name: 'timeZone',
      type: 'text',
      defaultValue: 'UTC',
      maxLength: 100,
    },
    {
      name: 'preferredCurrency',
      type: 'select',
      defaultValue: 'USD',
      options: ['USD', 'EUR', 'GBP', 'AED'],
    },
  ],
}
