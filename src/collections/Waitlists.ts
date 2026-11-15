import type { Access, CollectionBeforeValidateHook, CollectionConfig } from 'payload'

const ownWaitlists: Access = ({ req }) => {
  if (req.user?.collection === 'admins') return true
  if (req.user?.collection !== 'users') return false
  return { traveler: { equals: req.user.id } }
}

const prepareWaitlist: CollectionBeforeValidateHook = async ({ data, operation, req }) => {
  if (operation !== 'create' || req.user?.collection !== 'users') return data
  const departureID = typeof data?.departure === 'string' ? data.departure : data?.departure?.id
  if (!departureID) throw new Error('Choose a departure.')
  const departure = await req.payload.findByID({
    collection: 'departures',
    id: departureID,
    overrideAccess: false,
    req,
  })
  if (departure.status === 'cancelled' || departure.status === 'closed') {
    throw new Error('This departure is not accepting waitlist requests.')
  }
  return { ...data, traveler: req.user.id, status: 'waiting' }
}

export const Waitlists: CollectionConfig = {
  slug: 'waitlists',
  admin: { group: 'Operations', useAsTitle: 'id' },
  access: {
    create: ({ req }) => req.user?.collection === 'users',
    delete: ownWaitlists,
    read: ownWaitlists,
    update: ({ req }) => req.user?.collection === 'admins',
  },
  hooks: { beforeValidate: [prepareWaitlist] },
  fields: [
    { name: 'traveler', type: 'relationship', relationTo: 'users', required: true, index: true },
    {
      name: 'departure',
      type: 'relationship',
      relationTo: 'departures',
      required: true,
      index: true,
    },
    { name: 'travelers', type: 'number', required: true, min: 1, max: 20 },
    { name: 'note', type: 'textarea', maxLength: 1500 },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'waiting',
      options: ['waiting', 'offered', 'converted', 'expired', 'cancelled'],
    },
  ],
  indexes: [{ fields: ['traveler', 'departure'], unique: true }],
}
