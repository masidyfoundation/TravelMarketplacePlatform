import type { Access, CollectionBeforeValidateHook, CollectionConfig, Where } from 'payload'

const ownHolds: Access = ({ req }) => {
  if (req.user?.collection === 'admins') return true
  if (req.user?.collection !== 'users') return false
  return {
    or: [{ traveler: { equals: req.user.id } }, { agent: { equals: req.user.id } }],
  } as Where
}

const prepareHold: CollectionBeforeValidateHook = ({ data, operation, req }) => {
  if (operation === 'create' && req.user?.collection === 'users') {
    return {
      ...data,
      traveler: req.user.id,
      status: 'active',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    }
  }
  return data
}

export const ReservationHolds: CollectionConfig = {
  slug: 'reservation-holds',
  admin: {
    group: 'Operations',
    useAsTitle: 'id',
    defaultColumns: ['departure', 'traveler', 'seats', 'status', 'expiresAt'],
  },
  access: {
    create: ({ req }) => req.user?.collection === 'users',
    delete: ({ req }) => req.user?.collection === 'admins',
    read: ownHolds,
    update: ({ req }) => req.user?.collection === 'admins',
  },
  hooks: { beforeValidate: [prepareHold] },
  fields: [
    {
      name: 'departure',
      type: 'relationship',
      relationTo: 'departures',
      required: true,
      index: true,
    },
    {
      name: 'order',
      type: 'relationship',
      relationTo: 'orders',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'traveler',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      access: {
        create: ({ req }) => req.user?.collection === 'admins',
        update: ({ req }) => req.user?.collection === 'admins',
      },
    },
    { name: 'agent', type: 'relationship', relationTo: 'users', index: true },
    { name: 'seats', type: 'number', required: true, min: 1, max: 20 },
    {
      name: 'expiresAt',
      type: 'date',
      required: true,
      index: true,
      access: {
        create: ({ req }) => req.user?.collection === 'admins',
        update: ({ req }) => req.user?.collection === 'admins',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Converted', value: 'converted' },
        { label: 'Expired', value: 'expired' },
        { label: 'Released', value: 'released' },
      ],
      access: {
        create: ({ req }) => req.user?.collection === 'admins',
        update: ({ req }) => req.user?.collection === 'admins',
      },
    },
  ],
}
