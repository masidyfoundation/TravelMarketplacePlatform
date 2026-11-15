import { revalidateTag } from 'next/cache'
import type { Access, CollectionBeforeValidateHook, CollectionConfig, Where } from 'payload'

const ownProjects: Access = ({ req }) => {
  if (req.user?.collection === 'admins') return true
  if (req.user?.collection !== 'users') return false
  return { owner: { equals: req.user.id } }
}

const ownOrPublished: Access = ({ req }) => {
  if (req.user?.collection === 'admins') return true
  if (req.user?.collection === 'users') {
    return {
      or: [{ owner: { equals: req.user.id } }, { status: { equals: 'published' } }],
    } as Where
  }
  return { status: { equals: 'published' } }
}

const assignOwner: CollectionBeforeValidateHook = ({ data, operation, req }) => {
  if (operation === 'create' && req.user?.collection === 'users') {
    return { ...data, owner: req.user.id }
  }
  return data
}

export const AiProjects: CollectionConfig = {
  slug: 'ai-projects',
  admin: {
    group: 'Workspace',
    useAsTitle: 'title',
    defaultColumns: ['title', 'owner', 'type', 'status', 'updatedAt'],
  },
  access: {
    create: ({ req }) => req.user?.collection === 'users',
    delete: ownProjects,
    read: ownOrPublished,
    update: ownProjects,
  },
  hooks: {
    beforeValidate: [assignOwner],
    afterChange: [
      ({ doc, previousDoc }) => {
        revalidateTag('published-pages', 'max')
        if (doc.slug) revalidateTag(`page:${doc.slug}`, 'max')
        if (previousDoc?.slug && previousDoc.slug !== doc.slug) {
          revalidateTag(`page:${previousDoc.slug}`, 'max')
        }
        return doc
      },
    ],
    afterDelete: [
      ({ doc }) => {
        revalidateTag('published-pages', 'max')
        if (doc.slug) revalidateTag(`page:${doc.slug}`, 'max')
        return doc
      },
    ],
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
    { name: 'title', type: 'text', required: true },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Landing page', value: 'landing-page' },
        { label: 'Trip campaign', value: 'campaign' },
        { label: 'Travel itinerary', value: 'itinerary' },
        { label: 'Social content', value: 'social' },
        { label: 'Inventory enrichment', value: 'inventory-enrichment' },
        { label: 'Pricing intelligence', value: 'pricing-intelligence' },
        { label: 'Trip matching', value: 'trip-matching' },
        { label: 'Client proposal', value: 'proposal' },
        { label: 'Support assistant', value: 'support-assistant' },
      ],
    },
    { name: 'prompt', type: 'textarea', required: true, maxLength: 5000 },
    { name: 'generatedContent', type: 'json' },
    { name: 'slug', type: 'text', unique: true, index: true, maxLength: 100 },
    {
      name: 'template',
      type: 'select',
      defaultValue: 'editorial',
      options: ['editorial', 'immersive', 'minimal', 'campaign'],
    },
    { name: 'brandKit', type: 'relationship', relationTo: 'brand-kits' },
    {
      name: 'sections',
      type: 'array',
      maxRows: 30,
      fields: [
        {
          name: 'type',
          type: 'select',
          required: true,
          options: ['hero', 'text', 'features', 'quote', 'cta'],
        },
        { name: 'eyebrow', type: 'text', maxLength: 120 },
        { name: 'heading', type: 'text', required: true, maxLength: 240 },
        { name: 'body', type: 'textarea', required: true, maxLength: 5000 },
        { name: 'ctaLabel', type: 'text', maxLength: 80 },
        { name: 'ctaHref', type: 'text', maxLength: 300 },
      ],
    },
    {
      name: 'versions',
      type: 'array',
      maxRows: 50,
      fields: [
        { name: 'savedAt', type: 'date', required: true },
        { name: 'label', type: 'text', required: true },
        { name: 'sections', type: 'json', required: true },
      ],
    },
    { name: 'publishedAt', type: 'date' },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Generating', value: 'generating' },
        { label: 'Ready', value: 'ready' },
        { label: 'Published', value: 'published' },
        { label: 'Failed', value: 'failed' },
      ],
    },
  ],
}
