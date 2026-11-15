import type { Access, CollectionConfig, FieldAccess } from 'payload'

const ownNotifications: Access = ({ req }) => {
  if (req.user?.collection === 'admins') return true
  if (req.user?.collection !== 'users') return false
  return { recipient: { equals: req.user.id } }
}

const staffField: FieldAccess = ({ req }) => req.user?.collection === 'admins'

export const Notifications: CollectionConfig = {
  slug: 'notifications',
  admin: { group: 'Communications', useAsTitle: 'title' },
  access: {
    create: ({ req }) => req.user?.collection === 'admins',
    delete: ownNotifications,
    read: ownNotifications,
    update: ownNotifications,
  },
  fields: [
    {
      name: 'recipient',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      access: { create: staffField, update: staffField },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: ['booking', 'payment', 'message', 'reminder', 'support', 'system'],
      access: { create: staffField, update: staffField },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      maxLength: 180,
      access: { create: staffField, update: staffField },
    },
    {
      name: 'body',
      type: 'textarea',
      required: true,
      maxLength: 2000,
      access: { create: staffField, update: staffField },
    },
    {
      name: 'href',
      type: 'text',
      maxLength: 300,
      access: { create: staffField, update: staffField },
    },
    {
      name: 'scheduledFor',
      type: 'date',
      index: true,
      access: { create: staffField, update: staffField },
    },
    {
      name: 'deliveryStatus',
      type: 'select',
      required: true,
      defaultValue: 'in-app',
      options: ['scheduled', 'in-app', 'sent', 'failed'],
      access: { create: staffField, update: staffField },
    },
    {
      name: 'attempts',
      type: 'number',
      required: true,
      defaultValue: 0,
      min: 0,
      access: { create: staffField, update: staffField },
    },
    {
      name: 'lastError',
      type: 'text',
      maxLength: 1000,
      access: { create: staffField, update: staffField },
    },
    {
      name: 'nextAttemptAt',
      type: 'date',
      index: true,
      access: { create: staffField, update: staffField },
    },
    { name: 'readAt', type: 'date' },
  ],
}
