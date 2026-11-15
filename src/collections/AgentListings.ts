import { revalidateTag } from 'next/cache'
import type {
  Access,
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeValidateHook,
  CollectionConfig,
  Where,
} from 'payload'

const isAdmin = (user: { collection?: string } | null | undefined) => user?.collection === 'admins'

const isAgent = (user: { collection?: string; role?: unknown } | null | undefined) =>
  user?.collection === 'users' && user.role === 'agent'

const assignAgent: CollectionBeforeValidateHook = ({ data, operation, req }) => {
  const user = req.user
  if (operation === 'create' && user && isAgent(user)) {
    return { ...data, agent: user.id }
  }
  return data
}

const validateActiveTrip: CollectionBeforeValidateHook = async ({ data, originalDoc, req }) => {
  const tripID =
    typeof data?.trip === 'string'
      ? data.trip
      : typeof data?.trip === 'object' && data.trip
        ? data.trip.id
        : typeof originalDoc?.trip === 'string'
          ? originalDoc.trip
          : originalDoc?.trip?.id
  if (!tripID) return data
  const trip = await req.payload.findByID({
    collection: 'trips',
    id: tripID,
    overrideAccess: true,
  })
  if (trip.status !== 'active') {
    throw new Error('Only active marketplace trips can be listed.')
  }
  return data
}

const invalidateAgent = async (
  agent: unknown,
  req: Parameters<CollectionAfterChangeHook>[0]['req'],
) => {
  revalidateTag('agent-storefronts', 'max')
  const agentID =
    typeof agent === 'string'
      ? agent
      : typeof agent === 'object' && agent && 'id' in agent
        ? String(agent.id)
        : ''
  if (!agentID) return
  const profiles = await req.payload.find({
    collection: 'agent-profiles',
    where: { owner: { equals: agentID } },
    limit: 1,
    overrideAccess: true,
  })
  const slug = profiles.docs[0]?.slug
  if (slug) revalidateTag(`agent:${slug}`, 'max')
}

const afterListingChange: CollectionAfterChangeHook = async ({ doc, req }) => {
  await invalidateAgent(doc.agent, req)
  return doc
}

const afterListingDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  await invalidateAgent(doc.agent, req)
  return doc
}

export const AgentListings: CollectionConfig = {
  slug: 'agent-listings',
  admin: {
    group: 'Marketplace',
    useAsTitle: 'publicTitle',
    defaultColumns: ['publicTitle', 'agent', 'trip', 'status'],
  },
  access: {
    create: ({ req }) => isAdmin(req.user) || isAgent(req.user),
    delete: ({ req }) => {
      const user = req.user
      if (isAdmin(user)) return true
      if (user && isAgent(user)) return { agent: { equals: user.id } }
      return false
    },
    read: ({ req }) => {
      const user = req.user
      if (isAdmin(user)) return true
      if (user && isAgent(user)) {
        return {
          or: [{ status: { equals: 'active' } }, { agent: { equals: user.id } }],
        } as Where
      }
      return { status: { equals: 'active' } }
    },
    update: ({ req }) => {
      const user = req.user
      if (isAdmin(user)) return true
      if (user && isAgent(user)) return { agent: { equals: user.id } }
      return false
    },
  },
  hooks: {
    beforeValidate: [assignAgent, validateActiveTrip],
    afterChange: [afterListingChange],
    afterDelete: [afterListingDelete],
  },
  fields: [
    {
      name: 'publicTitle',
      type: 'text',
      required: true,
    },
    {
      name: 'agent',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      access: {
        create: ({ req }) => isAdmin(req.user),
        update: ({ req }) => isAdmin(req.user),
      },
    },
    {
      name: 'trip',
      type: 'relationship',
      relationTo: 'trips',
      required: true,
    },
    {
      name: 'personalNote',
      type: 'textarea',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Active', value: 'active' },
        { label: 'Archived', value: 'archived' },
      ],
    },
  ],
}
