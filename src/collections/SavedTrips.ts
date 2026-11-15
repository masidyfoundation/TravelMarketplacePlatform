import type { Access, CollectionBeforeValidateHook, CollectionConfig } from 'payload'

const ownSavedTrips: Access = ({ req }) => {
  if (req.user?.collection === 'admins') return true
  if (req.user?.collection !== 'users') return false
  return { owner: { equals: req.user.id } }
}

const assignOwner: CollectionBeforeValidateHook = ({ data, operation, req }) =>
  operation === 'create' && req.user?.collection === 'users'
    ? { ...data, owner: req.user.id }
    : data

const validateActiveTrip: CollectionBeforeValidateHook = async ({ data, originalDoc, req }) => {
  const tripID =
    typeof data?.trip === 'string'
      ? data.trip
      : typeof data?.trip === 'object' && data.trip
        ? data.trip.id
        : typeof originalDoc?.trip === 'string'
          ? originalDoc.trip
          : originalDoc?.trip?.id
  if (!tripID) return data
  const trip = await req.payload.findByID({
    collection: 'trips',
    id: tripID,
    overrideAccess: true,
  })
  if (trip.status !== 'active') {
    throw new Error('Only active marketplace trips can be saved.')
  }
  return data
}

export const SavedTrips: CollectionConfig = {
  slug: 'saved-trips',
  admin: { hidden: true },
  access: {
    create: ({ req }) => req.user?.collection === 'users',
    delete: ownSavedTrips,
    read: ownSavedTrips,
    update: ownSavedTrips,
  },
  hooks: { beforeValidate: [assignOwner, validateActiveTrip] },
  fields: [
    {
      name: 'owner',
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
    { name: 'note', type: 'textarea', maxLength: 1000 },
  ],
  indexes: [
    {
      fields: ['owner', 'trip'],
      unique: true,
    },
  ],
}
