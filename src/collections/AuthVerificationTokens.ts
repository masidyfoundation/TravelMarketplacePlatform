import type { Access, CollectionConfig } from 'payload'

const adminsOnly: Access = ({ req }) => req.user?.collection === 'admins'

export const AuthVerificationTokens: CollectionConfig = {
  slug: 'auth-verification-tokens',
  admin: {
    hidden: true,
  },
  access: {
    create: adminsOnly,
    delete: adminsOnly,
    read: adminsOnly,
    update: adminsOnly,
  },
  fields: [
    { name: 'identifier', type: 'text', required: true, index: true },
    { name: 'token', type: 'text', required: true, unique: true, index: true },
    { name: 'expires', type: 'date', required: true },
  ],
}
