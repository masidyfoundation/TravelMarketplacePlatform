import type { Access, CollectionConfig } from 'payload'

const adminsOnly: Access = ({ req }) => req.user?.collection === 'admins'

export const AuthAccounts: CollectionConfig = {
  slug: 'auth-accounts',
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
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    { name: 'type', type: 'text', required: true },
    { name: 'provider', type: 'text', required: true },
    { name: 'providerAccountId', type: 'text', required: true },
    { name: 'providerKey', type: 'text', required: true, unique: true, index: true },
    { name: 'refresh_token', type: 'textarea' },
    { name: 'access_token', type: 'textarea' },
    { name: 'expires_at', type: 'number' },
    { name: 'token_type', type: 'text' },
    { name: 'scope', type: 'text' },
    { name: 'id_token', type: 'textarea' },
    { name: 'session_state', type: 'text' },
  ],
}
