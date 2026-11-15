import type { Access, CollectionBeforeValidateHook, CollectionConfig } from 'payload'

const ownChanges: Access = ({ req }) => {
  if (req.user?.collection === 'admins') return true
  if (req.user?.collection !== 'users') return false
  return { requester: { equals: req.user.id } }
}

const prepareChange: CollectionBeforeValidateHook = async ({ data, operation, req }) => {
  if (operation !== 'create' || req.user?.collection !== 'users') return data
  const orderID = typeof data?.order === 'string' ? data.order : data?.order?.id
  if (!orderID) throw new Error('Choose an order.')
  const order = await req.payload.findByID({
    collection: 'orders',
    id: orderID,
    user: req.user,
    overrideAccess: false,
  })
  if (['cancelled', 'refunded'].includes(order.status)) {
    throw new Error('This order can no longer be changed.')
  }
  return { ...data, requester: req.user.id, status: 'requested' }
}

export const OrderChanges: CollectionConfig = {
  slug: 'order-changes',
  admin: { group: 'Operations', useAsTitle: 'id' },
  access: {
    create: ({ req }) => req.user?.collection === 'users',
    delete: ({ req }) => req.user?.collection === 'admins',
    read: ownChanges,
    update: ({ req }) => req.user?.collection === 'admins',
  },
  hooks: { beforeValidate: [prepareChange] },
  fields: [
    { name: 'order', type: 'relationship', relationTo: 'orders', required: true, index: true },
    { name: 'requester', type: 'relationship', relationTo: 'users', required: true, index: true },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: ['amendment', 'cancellation', 'refund'],
    },
    { name: 'details', type: 'textarea', required: true, maxLength: 5000 },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'requested',
      options: ['requested', 'reviewing', 'approved', 'declined', 'completed'],
    },
    { name: 'resolution', type: 'textarea', maxLength: 5000 },
  ],
}
