'use server'

import { getCurrentUser } from '@/lib/current-user'
import { getPayloadClient } from '@/lib/payload'

export type StorefrontState = {
  status: 'idle' | 'success' | 'error'
  message: string
}

export const initialStorefrontState: StorefrontState = {
  status: 'idle',
  message: '',
}

const value = (formData: FormData, key: string) => {
  const field = formData.get(key)
  return typeof field === 'string' ? field.trim() : ''
}

async function agentUser() {
  const user = await getCurrentUser()
  return user?.role === 'agent' ? user : null
}

export async function addStorefrontListing(
  _previous: StorefrontState,
  formData: FormData,
): Promise<StorefrontState> {
  const user = await agentUser()
  if (!user) return { status: 'error', message: 'Verified agent access is required.' }
  const trip = value(formData, 'trip')
  const publicTitle = value(formData, 'publicTitle')
  const personalNote = value(formData, 'personalNote')
  if (!trip || publicTitle.length < 3 || personalNote.length < 20) {
    return {
      status: 'error',
      message: 'Choose a journey and add a title and recommendation.',
    }
  }
  const payload = await getPayloadClient()
  const existing = await payload.find({
    collection: 'agent-listings',
    user,
    overrideAccess: false,
    where: {
      and: [
        { agent: { equals: user.id } },
        { trip: { equals: trip } },
        { status: { not_equals: 'archived' } },
      ],
    },
    limit: 1,
  })
  if (existing.totalDocs > 0) {
    return { status: 'error', message: 'That journey is already in your storefront.' }
  }
  try {
    await payload.create({
      collection: 'agent-listings',
      user,
      overrideAccess: false,
      draft: false,
      data: {
        trip,
        publicTitle,
        personalNote,
        status: 'draft',
      } as never,
    })
    return { status: 'success', message: 'Draft listing added.' }
  } catch {
    return { status: 'error', message: 'The listing could not be created.' }
  }
}

export async function updateStorefrontListing(
  _previous: StorefrontState,
  formData: FormData,
): Promise<StorefrontState> {
  const user = await agentUser()
  if (!user) return { status: 'error', message: 'Verified agent access is required.' }
  const id = value(formData, 'id')
  const publicTitle = value(formData, 'publicTitle')
  const personalNote = value(formData, 'personalNote')
  const status = value(formData, 'status')
  if (
    !id ||
    publicTitle.length < 3 ||
    personalNote.length < 20 ||
    !['draft', 'active', 'archived'].includes(status)
  ) {
    return { status: 'error', message: 'Check the listing details and status.' }
  }
  try {
    const payload = await getPayloadClient()
    await payload.update({
      collection: 'agent-listings',
      id,
      user,
      overrideAccess: false,
      data: {
        publicTitle,
        personalNote,
        status: status as 'draft' | 'active' | 'archived',
      },
    })
    return { status: 'success', message: 'Storefront listing updated.' }
  } catch {
    return { status: 'error', message: 'The listing could not be updated.' }
  }
}

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export async function saveAgentProfile(
  _previous: StorefrontState,
  formData: FormData,
): Promise<StorefrontState> {
  const user = await agentUser()
  if (!user) return { status: 'error', message: 'Verified agent access is required.' }
  const id = value(formData, 'id')
  const slug = value(formData, 'slug').toLowerCase()
  const displayName = value(formData, 'displayName')
  const tagline = value(formData, 'tagline')
  const bio = value(formData, 'bio')
  const location = value(formData, 'location')
  const status = value(formData, 'status')
  const specialties = value(formData, 'specialties')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 10)
  if (
    !slugPattern.test(slug) ||
    displayName.length < 2 ||
    tagline.length < 10 ||
    bio.length < 40 ||
    !['draft', 'published'].includes(status)
  ) {
    return {
      status: 'error',
      message: 'Check the slug, public name, tagline, biography, and status.',
    }
  }
  try {
    const payload = await getPayloadClient()
    const data = {
      slug,
      displayName,
      tagline,
      bio,
      location: location || undefined,
      status: status as 'draft' | 'published',
      specialties: specialties.map((name) => ({ name })),
    } as never
    if (id) {
      await payload.update({
        collection: 'agent-profiles',
        id,
        user,
        overrideAccess: false,
        data,
      })
    } else {
      await payload.create({
        collection: 'agent-profiles',
        user,
        overrideAccess: false,
        draft: false,
        data,
      })
    }
    return { status: 'success', message: 'Public storefront profile saved.' }
  } catch {
    return {
      status: 'error',
      message: 'The profile could not be saved. Try another storefront URL.',
    }
  }
}
