import type { Access, CollectionConfig, Where } from 'payload'

const ownStatements: Access = async ({ req }) => {
  if (req.user?.collection === 'admins') return true
  if (req.user?.collection !== 'users') return false
  const memberships = await req.payload.find({
    collection: 'agency-memberships',
    where: { and: [{ user: { equals: req.user.id } }, { status: { equals: 'active' } }] },
    limit: 100,
    overrideAccess: true,
  })
  const agencies = memberships.docs.map((membership) =>
    typeof membership.agency === 'string' ? membership.agency : membership.agency.id,
  )
  return {
    or: [
      { user: { equals: req.user.id } },
      ...(agencies.length ? [{ agency: { in: agencies } }] : []),
    ],
  } as Where
}

export const PayoutStatements: CollectionConfig = {
  slug: 'payout-statements',
  admin: { group: 'Finance', useAsTitle: 'stripePayoutId' },
  access: {
    create: ({ req }) => req.user?.collection === 'admins',
    delete: ({ req }) => req.user?.collection === 'admins',
    read: ownStatements,
    update: ({ req }) => req.user?.collection === 'admins',
  },
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', index: true },
    { name: 'agency', type: 'relationship', relationTo: 'agencies', index: true },
    { name: 'stripePayoutId', type: 'text', required: true, unique: true, index: true },
    { name: 'amount', type: 'number', required: true },
    { name: 'currency', type: 'text', required: true },
    { name: 'arrivalDate', type: 'date', required: true },
    {
      name: 'status',
      type: 'select',
      required: true,
      options: ['pending', 'paid', 'failed', 'cancelled'],
    },
    { name: 'failureMessage', type: 'text' },
  ],
}
