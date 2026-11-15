import { revalidateTag } from 'next/cache'
import type { CollectionConfig } from 'payload'

export const LegalPolicies: CollectionConfig = {
  slug: 'legal-policies',
  admin: { group: 'Trust & Onboarding', useAsTitle: 'title' },
  access: {
    create: ({ req }) => req.user?.collection === 'admins',
    delete: ({ req }) => req.user?.collection === 'admins',
    read: ({ req }) =>
      req.user?.collection === 'admins' ? true : { status: { equals: 'published' } },
    update: ({ req }) => req.user?.collection === 'admins',
  },
  hooks: {
    afterChange: [
      ({ doc, previousDoc }) => {
        revalidateTag('legal-policies', 'max')
        if (doc.slug) revalidateTag(`legal:${doc.slug}`, 'max')
        if (previousDoc?.slug && previousDoc.slug !== doc.slug) {
          revalidateTag(`legal:${previousDoc.slug}`, 'max')
        }
        return doc
      },
    ],
    afterDelete: [
      ({ doc }) => {
        revalidateTag('legal-policies', 'max')
        if (doc.slug) revalidateTag(`legal:${doc.slug}`, 'max')
        return doc
      },
    ],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'summary', type: 'textarea', required: true, maxLength: 1000 },
    { name: 'body', type: 'textarea', required: true, maxLength: 50000 },
    { name: 'version', type: 'text', required: true },
    { name: 'effectiveAt', type: 'date', required: true },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: ['draft', 'published', 'archived'],
    },
  ],
}
