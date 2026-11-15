import type { Access, CollectionBeforeValidateHook, CollectionConfig } from 'payload'

const isAdmin: Access = ({ req }) => req.user?.collection === 'admins'

const agencyOrAdminRead: Access = async ({ req }) => {
  if (req.user?.collection === 'admins') return true
  if (req.user?.collection !== 'users' || req.user.role !== 'agency') return false
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
  return agencyIDs.length > 0 ? { 'trip.agency': { in: agencyIDs } } : false
}

const assignInitialStatus: CollectionBeforeValidateHook = ({ data, operation }) =>
  operation === 'create' ? { ...data, status: 'new' } : data

const validateTrip: CollectionBeforeValidateHook = async ({ data, operation, req }) => {
  if (operation !== 'create' || !data?.trip) return data

  const tripID = typeof data.trip === 'object' && data.trip !== null ? data.trip.id : data.trip
  const trip = await req.payload.findByID({
    collection: 'trips',
    id: tripID,
    overrideAccess: false,
    req,
  })

  if (trip.status !== 'active') {
    throw new Error('This journey is not currently available for booking.')
  }

  return data
}

export const BookingRequests: CollectionConfig = {
  slug: 'booking-requests',
  admin: {
    group: 'Operations',
    useAsTitle: 'travelerName',
    defaultColumns: ['travelerName', 'trip', 'travelers', 'status', 'createdAt'],
  },
  access: {
    create: () => true,
    delete: isAdmin,
    read: agencyOrAdminRead,
    update: isAdmin,
  },
  hooks: {
    beforeValidate: [assignInitialStatus, validateTrip],
  },
  fields: [
    {
      name: 'travelerName',
      type: 'text',
      required: true,
      maxLength: 120,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
    },
    {
      name: 'phone',
      type: 'text',
      maxLength: 40,
    },
    {
      name: 'trip',
      type: 'relationship',
      relationTo: 'trips',
      required: true,
    },
    {
      name: 'travelers',
      type: 'number',
      required: true,
      min: 1,
      max: 20,
    },
    {
      name: 'preferredMonth',
      type: 'text',
      required: true,
      maxLength: 40,
    },
    {
      name: 'note',
      type: 'textarea',
      maxLength: 1200,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Quoted', value: 'quoted' },
        { label: 'Booked', value: 'booked' },
        { label: 'Closed', value: 'closed' },
      ],
      access: {
        create: ({ req }) => req.user?.collection === 'admins',
        update: ({ req }) => req.user?.collection === 'admins',
      },
    },
    {
      name: 'quotedAmount',
      type: 'number',
      min: 0,
      access: {
        create: ({ req }) => req.user?.collection === 'admins',
        update: ({ req }) => req.user?.collection === 'admins',
      },
    },
  ],
}
