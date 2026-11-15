import type { Access, CollectionBeforeValidateHook, CollectionConfig } from 'payload'

const ownProfile: Access = ({ req }) => {
  if (req.user?.collection === 'admins') return true
  if (req.user?.collection !== 'users') return false
  return { owner: { equals: req.user.id } }
}

const assignOwner: CollectionBeforeValidateHook = ({ data, operation, req }) =>
  operation === 'create' && req.user?.collection === 'users'
    ? { ...data, owner: req.user.id }
    : data

export const TravelerProfiles: CollectionConfig = {
  slug: 'traveler-profiles',
  admin: { group: 'Operations', useAsTitle: 'fullName' },
  access: {
    create: ({ req }) => req.user?.collection === 'users',
    delete: ownProfile,
    read: ownProfile,
    update: ownProfile,
  },
  hooks: { beforeValidate: [assignOwner] },
  fields: [
    { name: 'owner', type: 'relationship', relationTo: 'users', required: true, unique: true },
    { name: 'fullName', type: 'text', required: true, maxLength: 160 },
    { name: 'dateOfBirth', type: 'date' },
    { name: 'nationality', type: 'text', maxLength: 100 },
    { name: 'passportLastFour', type: 'text', minLength: 4, maxLength: 4 },
    { name: 'passportExpiry', type: 'date' },
    { name: 'dietaryNeeds', type: 'textarea', maxLength: 1500 },
    { name: 'accessibilityNeeds', type: 'textarea', maxLength: 1500 },
    { name: 'emergencyContactName', type: 'text', maxLength: 160 },
    { name: 'emergencyContactPhone', type: 'text', maxLength: 60 },
    { name: 'emergencyContactRelation', type: 'text', maxLength: 100 },
  ],
}
