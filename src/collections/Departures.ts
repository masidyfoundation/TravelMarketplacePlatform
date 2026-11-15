import { revalidateTag } from 'next/cache'
import type {
  Access,
  CollectionBeforeValidateHook,
  CollectionConfig,
  PayloadRequest,
  Where,
} from 'payload'

const managedTripIDs = async (req: PayloadRequest): Promise<string[]> => {
  if (req.user?.collection !== 'users' || req.user.role !== 'agency') return []
  const memberships = await req.payload.find({
    collection: 'agency-memberships',
    where: {
      and: [{ user: { equals: req.user.id } }, { status: { equals: 'active' } }],
    },
    limit: 100,
    overrideAccess: true,
  })
  const agencyIDs = memberships.docs.map((membership) =>
    typeof membership.agency === 'string' ? membership.agency : membership.agency.id,
  )
  if (agencyIDs.length === 0) return []
  const trips = await req.payload.find({
    collection: 'trips',
    where: { agency: { in: agencyIDs } },
    limit: 500,
    overrideAccess: true,
  })
  return trips.docs.map((trip) => String(trip.id))
}

const managedDepartures: Access = async ({ req }) => {
  if (req.user?.collection === 'admins') return true
  const tripIDs = await managedTripIDs(req)
  return tripIDs.length > 0 ? { trip: { in: tripIDs } } : false
}

const validateManagedTrip: CollectionBeforeValidateHook = async ({ data, originalDoc, req }) => {
  if (req.user?.collection !== 'users' || req.user.role !== 'agency') return data
  const tripID =
    typeof data?.trip === 'string'
      ? data.trip
      : typeof data?.trip === 'object' && data.trip
        ? data.trip.id
        : typeof originalDoc?.trip === 'string'
          ? originalDoc.trip
          : originalDoc?.trip?.id
  const tripIDs = await managedTripIDs(req)
  if (!tripID || !tripIDs.includes(String(tripID))) {
    throw new Error('You can only manage departures for your agency trips.')
  }
  return data
}

export const Departures: CollectionConfig = {
  slug: 'departures',
  admin: {
    group: 'Marketplace',
    useAsTitle: 'label',
    defaultColumns: ['label', 'trip', 'startDate', 'capacity', 'booked', 'status'],
  },
  access: {
    create: async ({ req }) =>
      req.user?.collection === 'admins' || (await managedTripIDs(req)).length > 0,
    delete: managedDepartures,
    read: async ({ req }) => {
      if (req.user?.collection === 'admins') return true
      const tripIDs = await managedTripIDs(req)
      return {
        or: [
          { status: { in: ['open', 'guaranteed'] } },
          ...(tripIDs.length > 0 ? [{ trip: { in: tripIDs } }] : []),
        ],
      } as Where
    },
    update: managedDepartures,
  },
  hooks: {
    beforeValidate: [validateManagedTrip],
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
    { name: 'label', type: 'text', required: true },
    {
      name: 'trip',
      type: 'relationship',
      relationTo: 'trips',
      required: true,
      index: true,
    },
    { name: 'startDate', type: 'date', required: true, index: true },
    { name: 'endDate', type: 'date', required: true },
    { name: 'capacity', type: 'number', required: true, min: 1 },
    { name: 'booked', type: 'number', required: true, min: 0, defaultValue: 0 },
    { name: 'priceOverride', type: 'number', min: 0 },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'open',
      options: [
        { label: 'Open', value: 'open' },
        { label: 'Guaranteed', value: 'guaranteed' },
        { label: 'Sold out', value: 'sold-out' },
        { label: 'Closed', value: 'closed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
  ],
}
