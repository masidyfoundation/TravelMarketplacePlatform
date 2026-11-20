import type { Access, CollectionBeforeValidateHook, CollectionConfig, Where } from 'payload'

const ownHolds: Access = ({ req }) => {
  if (req.user?.collection === 'admins') return true
  if (req.user?.collection !== 'users') return false
  return {
    or: [{ traveler: { equals: req.user.id } }, { agent: { equals: req.user.id } }],
  } as Where
}

const prepareHold: CollectionBeforeValidateHook = async ({ data, operation, req }) => {
  if (operation !== 'create' || req.user?.collection !== 'users') return data

  const orderID =
    typeof data?.order === 'string'
      ? data.order
      : typeof data?.order === 'object' && data.order
        ? data.order.id
        : null
  const departureID =
    typeof data?.departure === 'string'
      ? data.departure
      : typeof data?.departure === 'object' && data.departure
        ? data.departure.id
        : null
  const seats = Number(data?.seats)
  if (!orderID || !departureID || !Number.isInteger(seats) || seats < 1 || seats > 20) {
    throw new Error('Choose a valid order, departure, and traveler count.')
  }

  const [order, departure, activeHolds] = await Promise.all([
    req.payload.findByID({
      collection: 'orders',
      id: orderID,
      req,
      overrideAccess: false,
      depth: 0,
    }),
    req.payload.findByID({
      collection: 'departures',
      id: departureID,
      req,
      overrideAccess: false,
      depth: 0,
    }),
    req.payload.find({
      collection: 'reservation-holds',
      where: {
        and: [
          { departure: { equals: departureID } },
          { status: { equals: 'active' } },
          { expiresAt: { greater_than: new Date().toISOString() } },
        ],
      },
      limit: 500,
      overrideAccess: true,
    }),
  ])
  const orderDepartureID =
    typeof order.departure === 'string' ? order.departure : order.departure?.id
  const orderTripID = typeof order.trip === 'string' ? order.trip : order.trip.id
  const departureTripID =
    typeof departure.trip === 'string' ? departure.trip : departure.trip.id
  const heldSeats = activeHolds.docs.reduce((total, hold) => total + hold.seats, 0)
  if (
    String(orderDepartureID) !== String(departureID) ||
    String(orderTripID) !== String(departureTripID) ||
    order.travelers !== seats ||
    !['open', 'guaranteed'].includes(departure.status) ||
    departure.capacity - departure.booked - heldSeats < seats
  ) {
    throw new Error('This reservation hold is no longer valid.')
  }

  const agentID = order.agent
    ? typeof order.agent === 'string'
      ? order.agent
      : order.agent.id
    : undefined
  return {
    ...data,
    traveler: req.user.id,
    agent: agentID,
    status: 'active',
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  }
}

export const ReservationHolds: CollectionConfig = {
  slug: 'reservation-holds',
  admin: {
    group: 'Operations',
    useAsTitle: 'id',
    defaultColumns: ['departure', 'traveler', 'seats', 'status', 'expiresAt'],
  },
  access: {
    create: ({ req }) =>
      req.user?.collection === 'users' && req.context?.checkout === true,
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
