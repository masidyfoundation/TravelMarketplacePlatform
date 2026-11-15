import type { Access, CollectionConfig, Where } from 'payload'

const ownLedger: Access = async ({ req }) => {
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

export const LedgerEntries: CollectionConfig = {
  slug: 'ledger-entries',
  admin: { group: 'Finance', useAsTitle: 'id' },
  access: {
    create: ({ req }) => req.user?.collection === 'admins',
    delete: ({ req }) => req.user?.collection === 'admins',
    read: ownLedger,
    update: ({ req }) => req.user?.collection === 'admins',
  },
  fields: [
    { name: 'order', type: 'relationship', relationTo: 'orders', required: true, index: true },
    { name: 'user', type: 'relationship', relationTo: 'users', index: true },
    { name: 'agency', type: 'relationship', relationTo: 'agencies', index: true },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        'gross',
        'platform-fee',
        'agent-commission',
        'agency-net',
        'refund',
        'reversal',
        'payout',
      ],
    },
    { name: 'amount', type: 'number', required: true },
    { name: 'currency', type: 'select', required: true, options: ['USD', 'EUR', 'GBP', 'AED'] },
    { name: 'stripeTransferId', type: 'text', index: true },
    { name: 'note', type: 'text', maxLength: 500 },
  ],
}
