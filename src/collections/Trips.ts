import type { Access, CollectionBeforeValidateHook, CollectionConfig, Where } from 'payload'
import { revalidateTag } from 'next/cache'

const isAdmin: Access = ({ req }) => req.user?.collection === 'admins'

const agencyIDsForUser = async (req: Parameters<Access>[0]['req']): Promise<string[]> => {
  if (req.user?.collection !== 'users' || req.user.role !== 'agency') return []
  const memberships = await req.payload.find({
    collection: 'agency-memberships',
    where: {
      and: [{ user: { equals: req.user.id } }, { status: { equals: 'active' } }],
    },
    limit: 100,
    overrideAccess: true,
  })
  return memberships.docs.map((membership) =>
    typeof membership.agency === 'string' ? membership.agency : membership.agency.id,
  )
}

const agencyManaged: Access = async ({ req }) => {
  if (req.user?.collection === 'admins') return true
  const agencyIDs = await agencyIDsForUser(req)
  return agencyIDs.length > 0 ? { agency: { in: agencyIDs } } : false
}

const validateAgencyOwnership: CollectionBeforeValidateHook = async ({
  data,
  originalDoc,
  req,
}) => {
  if (req.user?.collection !== 'users' || req.user.role !== 'agency') return data
  const agencyIDs = await agencyIDsForUser(req)
  const requestedAgency =
    typeof data?.agency === 'string'
      ? data.agency
      : typeof data?.agency === 'object' && data.agency
        ? data.agency.id
        : typeof originalDoc?.agency === 'string'
          ? originalDoc.agency
          : originalDoc?.agency?.id
  if (!requestedAgency || !agencyIDs.includes(String(requestedAgency))) {
    throw new Error('You can only manage trips for your agency.')
  }
  return data
}

export const Trips: CollectionConfig = {
  slug: 'trips',
  admin: {
    group: 'Marketplace',
    useAsTitle: 'title',
    defaultColumns: ['title', 'destination', 'agency', 'price', 'status'],
  },
  access: {
    create: ({ req }) =>
      req.user?.collection === 'admins' ||
      (req.user?.collection === 'users' && req.user.role === 'agency'),
    delete: agencyManaged,
    read: async ({ req }) => {
      if (req.user?.collection === 'admins') return true
      const agencyIDs = await agencyIDsForUser(req)
      if (agencyIDs.length === 0) return { status: { equals: 'active' } }
      return {
        or: [{ status: { equals: 'active' } }, { agency: { in: agencyIDs } }],
      } as Where
    },
    update: agencyManaged,
  },
  hooks: {
    beforeValidate: [validateAgencyOwnership],
    afterChange: [
      ({ doc, previousDoc }) => {
        revalidateTag('marketplace', 'max')
        if (doc.slug) revalidateTag(`trip:${doc.slug}`, 'max')
        if (previousDoc?.slug && previousDoc.slug !== doc.slug) {
          revalidateTag(`trip:${previousDoc.slug}`, 'max')
        }
        return doc
      },
    ],
    afterDelete: [
      ({ doc }) => {
        revalidateTag('marketplace', 'max')
        if (doc.slug) revalidateTag(`trip:${doc.slug}`, 'max')
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'title',
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
      name: 'destination',
      type: 'text',
      required: true,
    },
    {
      name: 'country',
      type: 'text',
      required: true,
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Beach', value: 'beach' },
        { label: 'Culture', value: 'culture' },
        { label: 'Adventure', value: 'adventure' },
        { label: 'Wellness', value: 'wellness' },
        { label: 'Luxury', value: 'luxury' },
      ],
    },
    {
      name: 'agency',
      type: 'relationship',
      relationTo: 'agencies',
      required: true,
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'durationDays',
      type: 'number',
      required: true,
      min: 1,
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'currency',
      type: 'select',
      required: true,
      defaultValue: 'USD',
      options: ['USD', 'EUR', 'GBP', 'AED'],
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
      name: 'agentCommission',
      type: 'number',
      required: true,
      min: 0,
      max: 50,
      admin: {
        description: 'Percentage earned by an agent when this trip is resold.',
      },
    },
    {
      name: 'tagline',
      type: 'text',
      required: true,
    },
    {
      name: 'summary',
      type: 'textarea',
      maxLength: 3000,
    },
    {
      name: 'gallery',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
    },
    {
      name: 'highlights',
      type: 'array',
      maxRows: 12,
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea' },
      ],
    },
    {
      name: 'itinerary',
      type: 'array',
      maxRows: 30,
      fields: [
        { name: 'day', type: 'number', required: true, min: 1 },
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea', required: true },
      ],
    },
    {
      name: 'inclusions',
      type: 'array',
      fields: [{ name: 'item', type: 'text', required: true }],
    },
    {
      name: 'exclusions',
      type: 'array',
      fields: [{ name: 'item', type: 'text', required: true }],
    },
    { name: 'accommodation', type: 'text' },
    { name: 'transport', type: 'text' },
    { name: 'meetingPoint', type: 'text' },
    {
      name: 'difficulty',
      type: 'select',
      options: ['easy', 'moderate', 'active', 'challenging'],
    },
    { name: 'cancellationPolicy', type: 'textarea', maxLength: 3000 },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Active', value: 'active' },
        { label: 'Paused', value: 'paused' },
      ],
    },
  ],
}
