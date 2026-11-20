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
    if (doc.type === 'agency') {
      const memberships = await req.payload.find({
        collection: 'agency-memberships',
        where: { user: { equals: ownerID } },
        limit: 1,
        overrideAccess: true,
        req,
      })
      if (memberships.totalDocs === 0) {
        const owner = await req.payload.findByID({
          collection: 'users',
          id: ownerID,
          overrideAccess: true,
          req,
        })
        const baseSlug =
          String(doc.businessName)
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 65) || 'travel-agency'
        const existingSlug = await req.payload.find({
          collection: 'agencies',
          where: { slug: { equals: baseSlug } },
          limit: 1,
          overrideAccess: true,
          req,
        })
        const slug =
          existingSlug.totalDocs === 0
            ? baseSlug
            : `${baseSlug}-${String(doc.id)
                .replace(/[^a-z0-9]/gi, '')
                .slice(0, 8)
                .toLowerCase()}`
        const agency = await req.payload.create({
          collection: 'agencies',
          overrideAccess: true,
          req,
          data: {
            name: doc.businessName,
            slug,
            location: doc.country,
            specialty:
              doc.specialties?.map((item: { name: string }) => item.name).join(', ') ||
              'Custom travel',
            description: doc.experience,
            website: doc.website || undefined,
            contactEmail: owner.email,
            supportPhone: doc.phone,
            rating: 0,
            reviewCount: 0,
            yearsActive: 0,
            status: 'pending',
            isDemo: false,
          },
        })
        await req.payload.create({
          collection: 'agency-memberships',
          overrideAccess: true,
          req,
          data: {
            user: ownerID,
            agency: agency.id,
            role: 'owner',
            status: 'active',
          },
        })
      }
    }
    await req.payload.update({
      collection: 'users',
      id: ownerID,
      data: { role: doc.type, status: 'active' },
      overrideAccess: true,
      req,
    })
    await req.payload.create({
      collection: 'notifications',
      overrideAccess: true,
      req,
      data: {
        recipient: ownerID,
        type: 'system',
        title: 'Your Masidy partner application is approved',
        body:
          doc.type === 'agency'
            ? 'Your agency workspace is ready. Complete your provider profile, payouts, and first trip for verification.'
            : 'Your agent workspace is ready. Complete payouts and publish your storefront profile.',
        href: doc.type === 'agency' ? '/dashboard/inventory' : '/dashboard/storefront',
        scheduledFor: new Date().toISOString(),
        deliveryStatus: 'scheduled',
        attempts: 0,
      },
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
