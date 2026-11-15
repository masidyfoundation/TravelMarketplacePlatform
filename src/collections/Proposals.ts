import { randomUUID } from 'node:crypto'
import type { Access, CollectionBeforeValidateHook, CollectionConfig, Where } from 'payload'

const ownProposals: Access = ({ req }) => {
  if (req.user?.collection === 'admins') return true
  if (req.user?.collection !== 'users') return false
  return {
    or: [{ agent: { equals: req.user.id } }, { traveler: { equals: req.user.id } }],
  } as Where
}

const prepareProposal: CollectionBeforeValidateHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (req.user?.collection !== 'users') return data
  if (operation === 'create' && req.user.role === 'agent') {
    const users = await req.payload.find({
      collection: 'users',
      where: { email: { equals: data?.travelerEmail } },
      limit: 1,
      overrideAccess: true,
    })
    return {
      ...data,
      agent: req.user.id,
      traveler: users.docs[0]?.id,
      reference: `Q-${randomUUID().slice(0, 8).toUpperCase()}`,
      status: 'draft',
    }
  }
  if (operation === 'update') {
    const agentID =
      typeof originalDoc?.agent === 'string' ? originalDoc.agent : originalDoc?.agent?.id
    const travelerID =
      typeof originalDoc?.traveler === 'string' ? originalDoc.traveler : originalDoc?.traveler?.id
    const requestedStatus = data?.status ?? originalDoc?.status
    if (
      String(agentID) === String(req.user.id) &&
      !['draft', 'sent', 'expired'].includes(requestedStatus)
    ) {
      throw new Error('Agents can draft, send, or expire proposals.')
    }
    if (
      String(travelerID) === String(req.user.id) &&
      !['viewed', 'accepted', 'declined'].includes(requestedStatus)
    ) {
      throw new Error('Travelers can view, accept, or decline proposals.')
    }
  }
  return data
}

export const Proposals: CollectionConfig = {
  slug: 'proposals',
  admin: { group: 'Operations', useAsTitle: 'reference' },
  access: {
    create: ({ req }) => req.user?.collection === 'users' && req.user.role === 'agent',
    delete: ownProposals,
    read: ownProposals,
    update: ownProposals,
  },
  hooks: { beforeValidate: [prepareProposal] },
  fields: [
    { name: 'reference', type: 'text', required: true, unique: true, index: true },
    { name: 'agent', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'traveler', type: 'relationship', relationTo: 'users', index: true },
    { name: 'travelerName', type: 'text', required: true, maxLength: 120 },
    { name: 'travelerEmail', type: 'email', required: true },
    { name: 'trip', type: 'relationship', relationTo: 'trips', required: true },
    { name: 'departure', type: 'relationship', relationTo: 'departures' },
    { name: 'travelers', type: 'number', required: true, min: 1, max: 20 },
    { name: 'amount', type: 'number', required: true, min: 0 },
    { name: 'currency', type: 'select', required: true, options: ['USD', 'EUR', 'GBP', 'AED'] },
    { name: 'validUntil', type: 'date', required: true },
    { name: 'message', type: 'textarea', required: true, maxLength: 5000 },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: ['draft', 'sent', 'viewed', 'accepted', 'declined', 'expired'],
    },
  ],
}
