import type { Access, CollectionBeforeValidateHook, CollectionConfig } from 'payload'

const participantConversations: Access = ({ req }) => {
  if (req.user?.collection === 'admins') return true
  if (req.user?.collection !== 'users') return false
  return { participants: { contains: req.user.id } }
}

const prepareConversation: CollectionBeforeValidateHook = async ({ data, operation, req }) => {
  if (operation !== 'create' || req.user?.collection !== 'users') return data
  const orderID = typeof data?.order === 'string' ? data.order : data?.order?.id
  if (!orderID) throw new Error('Choose an order.')
  const order = await req.payload.findByID({
    collection: 'orders',
    id: orderID,
    user: req.user,
    overrideAccess: false,
  })
  const participantIDs = new Set<string>([String(order.traveler)])
  if (order.agent) {
    participantIDs.add(typeof order.agent === 'string' ? order.agent : String(order.agent.id))
  }
  const agencyID = typeof order.agency === 'string' ? order.agency : String(order.agency.id)
  const memberships = await req.payload.find({
    collection: 'agency-memberships',
    where: {
      and: [{ agency: { equals: agencyID } }, { status: { equals: 'active' } }],
    },
    limit: 100,
    overrideAccess: true,
  })
  memberships.docs.forEach((membership) =>
    participantIDs.add(
      typeof membership.user === 'string' ? membership.user : String(membership.user.id),
    ),
  )
  if (!participantIDs.has(String(req.user.id))) {
    throw new Error('You are not part of this booking.')
  }
  return {
    ...data,
    participants: Array.from(participantIDs),
    status: 'open',
  }
}

export const Conversations: CollectionConfig = {
  slug: 'conversations',
  admin: { group: 'Communications', useAsTitle: 'subject' },
  access: {
    create: ({ req }) => req.user?.collection === 'users',
    delete: ({ req }) => req.user?.collection === 'admins',
    read: participantConversations,
    update: participantConversations,
  },
  hooks: { beforeValidate: [prepareConversation] },
  fields: [
    {
      name: 'order',
      type: 'relationship',
      relationTo: 'orders',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'participants',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      required: true,
      index: true,
      access: {
        create: ({ req }) => req.user?.collection === 'admins',
        update: ({ req }) => req.user?.collection === 'admins',
      },
    },
    { name: 'subject', type: 'text', required: true, maxLength: 180 },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'open',
      options: ['open', 'archived'],
    },
  ],
}
