import type { Access, CollectionBeforeValidateHook, CollectionConfig } from 'payload'

const ownTickets: Access = ({ req }) => {
  if (req.user?.collection === 'admins') return true
  if (req.user?.collection !== 'users') return false
  return { owner: { equals: req.user.id } }
}

const prepareTicket: CollectionBeforeValidateHook = ({ data, operation, req }) =>
  operation === 'create' && req.user?.collection === 'users'
    ? { ...data, owner: req.user.id, status: 'open' }
    : data

export const SupportTickets: CollectionConfig = {
  slug: 'support-tickets',
  admin: {
    group: 'Operations',
    useAsTitle: 'subject',
    defaultColumns: ['subject', 'owner', 'priority', 'status', 'updatedAt'],
  },
  access: {
    create: ({ req }) => req.user?.collection === 'users',
    delete: ({ req }) => req.user?.collection === 'admins',
    read: ownTickets,
    update: ownTickets,
  },
  hooks: { beforeValidate: [prepareTicket] },
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
    { name: 'order', type: 'relationship', relationTo: 'orders' },
    { name: 'subject', type: 'text', required: true, maxLength: 180 },
    { name: 'message', type: 'textarea', required: true, maxLength: 5000 },
    {
      name: 'priority',
      type: 'select',
      defaultValue: 'normal',
      options: ['low', 'normal', 'high', 'urgent'],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'open',
      options: [
        { label: 'Open', value: 'open' },
        { label: 'In progress', value: 'in-progress' },
        { label: 'Waiting for customer', value: 'waiting' },
        { label: 'Resolved', value: 'resolved' },
        { label: 'Closed', value: 'closed' },
      ],
      access: {
        create: ({ req }) => req.user?.collection === 'admins',
        update: ({ req }) => req.user?.collection === 'admins',
      },
    },
    {
      name: 'internalNotes',
      type: 'textarea',
      access: {
        read: ({ req }) => req.user?.collection === 'admins',
        create: ({ req }) => req.user?.collection === 'admins',
        update: ({ req }) => req.user?.collection === 'admins',
      },
    },
  ],
}
