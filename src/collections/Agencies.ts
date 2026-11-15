import type { Access, CollectionConfig } from 'payload'
import { revalidateTag } from 'next/cache'

const isAdmin: Access = ({ req }) => req.user?.collection === 'admins'

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
    },
    {
      name: 'reviewCount',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'yearsActive',
      type: 'number',
      required: true,
      min: 0,
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
    },
  ],
}
