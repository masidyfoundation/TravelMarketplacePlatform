import type { Adapter, AdapterAccount, AdapterUser, VerificationToken } from 'next-auth/adapters'
import { getPayloadClient } from '@/lib/payload'
import type { User } from '@/payload-types'

const toAdapterUser = (user: User): AdapterUser => ({
  id: user.id,
  email: user.email,
  name: user.name,
  image: user.image ?? null,
  emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
})

export const payloadAuthAdapter: Adapter = {
  async createUser(user) {
    const payload = await getPayloadClient()
    const created = await payload.create({
      collection: 'users',
      overrideAccess: true,
      draft: false,
      data: {
        email: user.email.toLowerCase(),
        name: user.name || user.email.split('@')[0],
        image: user.image,
        emailVerified: user.emailVerified?.toISOString(),
        role: 'traveler',
        status: 'active',
      },
    })
    return toAdapterUser(created)
  },

  async getUser(id) {
    const payload = await getPayloadClient()
    try {
      const user = await payload.findByID({
        collection: 'users',
        id,
        overrideAccess: true,
      })
      return toAdapterUser(user)
    } catch {
      return null
    }
  },

  async getUserByEmail(email) {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'users',
      where: { email: { equals: email.toLowerCase() } },
      limit: 1,
      overrideAccess: true,
    })
    return result.docs[0] ? toAdapterUser(result.docs[0]) : null
  },

  async getUserByAccount({ provider, providerAccountId }) {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'auth-accounts',
      where: {
        providerKey: { equals: `${provider}:${providerAccountId}` },
      },
      depth: 1,
      limit: 1,
      overrideAccess: true,
    })
    const account = result.docs[0]
    if (!account || typeof account.user === 'string') return null
    return toAdapterUser(account.user)
  },

  async updateUser(user) {
    const payload = await getPayloadClient()
    const updated = await payload.update({
      collection: 'users',
      id: user.id,
      overrideAccess: true,
      data: {
        email: user.email?.toLowerCase(),
        name: user.name ?? undefined,
        image: user.image,
        emailVerified: user.emailVerified?.toISOString(),
      },
    })
    return toAdapterUser(updated)
  },

  async linkAccount(account) {
    const payload = await getPayloadClient()
    await payload.create({
      collection: 'auth-accounts',
      overrideAccess: true,
      draft: false,
      data: {
        user: account.userId,
        type: account.type,
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        providerKey: `${account.provider}:${account.providerAccountId}`,
        refresh_token: account.refresh_token,
        access_token: account.access_token,
        expires_at: account.expires_at,
        token_type: account.token_type,
        scope: account.scope,
        id_token: account.id_token,
        session_state:
          typeof account.session_state === 'string' ? account.session_state : undefined,
      },
    })
    return account
  },

  async unlinkAccount({ provider, providerAccountId }) {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'auth-accounts',
      where: {
        providerKey: { equals: `${provider}:${providerAccountId}` },
      },
      limit: 1,
      overrideAccess: true,
    })
    const account = result.docs[0]
    if (!account) return undefined
    await payload.delete({
      collection: 'auth-accounts',
      id: account.id,
      overrideAccess: true,
    })
    return {
      userId: typeof account.user === 'string' ? account.user : account.user.id,
      type: account.type as AdapterAccount['type'],
      provider: account.provider,
      providerAccountId: account.providerAccountId,
    }
  },

  async createVerificationToken(token) {
    const payload = await getPayloadClient()
    await payload.create({
      collection: 'auth-verification-tokens',
      overrideAccess: true,
      draft: false,
      data: {
        identifier: token.identifier.toLowerCase(),
        token: token.token,
        expires: token.expires.toISOString(),
      },
    })
    return token
  },

  async useVerificationToken({ identifier, token }) {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'auth-verification-tokens',
      where: {
        and: [{ identifier: { equals: identifier.toLowerCase() } }, { token: { equals: token } }],
      },
      limit: 1,
      overrideAccess: true,
    })
    const stored = result.docs[0]
    if (!stored) return null
    await payload.delete({
      collection: 'auth-verification-tokens',
      id: stored.id,
      overrideAccess: true,
    })
    return {
      identifier: stored.identifier,
      token: stored.token,
      expires: new Date(stored.expires),
    } satisfies VerificationToken
  },
}
