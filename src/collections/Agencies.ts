import type { Access, CollectionBeforeValidateHook, CollectionConfig, FieldAccess } from 'payload'
import { revalidateTag } from 'next/cache'

const isAdmin: Access = ({ req }) => req.user?.collection === 'admins'
const isAdminField: FieldAccess = ({ req }) => req.user?.collection === 'admins'

const agencyManaged: Access = async ({ req }) => {
  if (req.user?.collection === 'admins') return true
  if (req.user?.collection !== 'users' || req.user.role !== 'agency') return false
  const memberships = await req.payload.find({
    collection: 'agency-memberships',
    where: {
      and: [{ user: { equals: req.user.id } }, { status: { equals: 'active' } }],
    },
    limit: 100,
    overrideAccess: true,
  })
  const agencyIDs = memberships.docs.map((membership) =>
    typeof membership.agency === 'string' ? membership.agency : membership.agency.id,
  )
  return agencyIDs.length > 0 ? { id: { in: agencyIDs } } : false
}

const validateVerification: CollectionBeforeValidateHook = async ({ data, originalDoc, req }) => {
  const next = { ...originalDoc, ...data }
  if (next.status !== 'verified') return data
  if (
    !next.website ||
    !next.contactEmail ||
    !next.supportPhone ||
    !next.coverImage ||
    !Array.isArray(next.licenses) ||
    next.licenses.length === 0
  ) {
    throw new Error(
      'Verification requires a website, contact email, support phone, cover image, and at least one license.',
    )
  }
  if (!originalDoc?.id) {
    throw new Error('Create the agency as pending before verification.')
  }
  const accounts = await req.payload.find({
    collection: 'payment-accounts',
    where: {
      and: [
        { agency: { equals: originalDoc.id } },
        { payoutsEnabled: { equals: true } },
        { status: { equals: 'enabled' } },
      ],
    },
    limit: 1,
    overrideAccess: true,
    req,
  })
  if (accounts.totalDocs === 0) {
    throw new Error('Verification requires a completed Stripe Connect payout account.')
  }
  return data
}

export const Agencies: CollectionConfig = {
  slug: 'agencies',
  admin: {
    group: 'Marketplace',
    useAsTitle: 'name',
    defaultColumns: ['name', 'location', 'rating', 'status'],
  },
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: ({ req }) =>
      req.user?.collection === 'admins' ? true : { status: { equals: 'verified' } },
    update: agencyManaged,
  },
  hooks: {
    beforeValidate: [validateVerification],
    afterChange: [
      ({ doc, previousDoc }) => {
        revalidateTag('marketplace', 'max')
        if (doc.slug) revalidateTag(`agency:${doc.slug}`, 'max')
        if (previousDoc?.slug && previousDoc.slug !== doc.slug) {
          revalidateTag(`agency:${previousDoc.slug}`, 'max')
        }
        return doc
      },
    ],
    afterDelete: [
      ({ doc }) => {
        revalidateTag('marketplace', 'max')
        if (doc.slug) revalidateTag(`agency:${doc.slug}`, 'max')
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'location',
      type: 'text',
      required: true,
    },
    {
      name: 'specialty',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
    },
    { name: 'website', type: 'text' },
    { name: 'contactEmail', type: 'email' },
    { name: 'supportPhone', type: 'text' },
    {
      name: 'languages',
      type: 'array',
      fields: [{ name: 'language', type: 'text', required: true }],
    },
    {
      name: 'licenses',
      type: 'array',
      fields: [
        { name: 'authority', type: 'text', required: true },
        { name: 'number', type: 'text', required: true },
      ],
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'rating',
      type: 'number',
      required: true,
      min: 0,
      max: 5,
      access: {
        create: isAdminField,
        update: isAdminField,
      },
    },
    {
      name: 'reviewCount',
      type: 'number',
      required: true,
      min: 0,
      access: {
        create: isAdminField,
        update: isAdminField,
      },
    },
    {
      name: 'yearsActive',
      type: 'number',
      required: true,
      min: 0,
      access: {
        create: isAdminField,
        update: isAdminField,
      },
    },
    {
      name: 'isDemo',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Show this sample provider only in the product demo.',
        position: 'sidebar',
      },
      access: {
        create: isAdminField,
        update: isAdminField,
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Verified', value: 'verified' },
        { label: 'Suspended', value: 'suspended' },
      ],
      access: {
        create: isAdminField,
        update: isAdminField,
      },
    },
  ],
}
