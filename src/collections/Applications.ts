import type {
  Access,
  CollectionAfterChangeHook,
  CollectionBeforeValidateHook,
  CollectionConfig,
  Where,
} from 'payload'
import { auditChanges, auditDeletes } from '@/lib/audit-hook'

const ownApplications: Access = ({ req }) => {
  if (req.user?.collection === 'admins') return true
  if (req.user?.collection !== 'users') return false
  return { owner: { equals: req.user.id } }
}

const assignOwner: CollectionBeforeValidateHook = ({ data, operation, req }) =>
  req.user?.collection === 'users'
    ? operation === 'create'
      ? { ...data, owner: req.user.id, status: 'submitted' }
      : { ...data, status: 'submitted' }
    : data

const resubmittableApplications: Access = ({ req }) => {
  if (req.user?.collection === 'admins') return true
  if (req.user?.collection !== 'users') return false
  return {
    and: [
      { owner: { equals: req.user.id } },
      { status: { in: ['changes-requested', 'declined'] } },
    ],
  } as Where
}

const activateApprovedRole: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  if (doc.status !== 'approved' || previousDoc?.status === 'approved') return doc
  const ownerID = typeof doc.owner === 'string' ? doc.owner : doc.owner?.id
  if (ownerID) {
    await req.payload.update({
      collection: 'users',
      id: ownerID,
      data: { role: doc.type, status: 'active' },
      overrideAccess: true,
    })
  }
  return doc
}

export const Applications: CollectionConfig = {
  slug: 'applications',
  admin: {
    group: 'Trust & Onboarding',
    useAsTitle: 'businessName',
    defaultColumns: ['businessName', 'type', 'owner', 'status', 'createdAt'],
  },
  access: {
    create: ({ req }) => req.user?.collection === 'users',
    delete: ({ req }) => req.user?.collection === 'admins',
    read: ownApplications,
    update: resubmittableApplications,
  },
  hooks: {
    beforeValidate: [assignOwner],
    afterChange: [activateApprovedRole, auditChanges('applications')],
    afterDelete: [auditDeletes('applications')],
  },
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
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Travel agent', value: 'agent' },
        { label: 'Travel agency', value: 'agency' },
      ],
    },
    { name: 'businessName', type: 'text', required: true, maxLength: 160 },
    { name: 'website', type: 'text', maxLength: 300 },
    { name: 'country', type: 'text', required: true, maxLength: 120 },
    { name: 'phone', type: 'text', required: true, maxLength: 50 },
    {
      name: 'experience',
      type: 'textarea',
      required: true,
      maxLength: 3000,
    },
    {
      name: 'specialties',
      type: 'array',
      maxRows: 12,
      fields: [{ name: 'name', type: 'text', required: true }],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'submitted',
      options: [
        { label: 'Submitted', value: 'submitted' },
        { label: 'In review', value: 'review' },
        { label: 'Approved', value: 'approved' },
        { label: 'Changes requested', value: 'changes-requested' },
        { label: 'Declined', value: 'declined' },
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
