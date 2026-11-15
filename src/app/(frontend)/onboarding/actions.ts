'use server'

import { getCurrentUser } from '@/lib/current-user'
import { getPayloadClient } from '@/lib/payload'

export type ApplicationState = {
  status: 'idle' | 'success' | 'error'
  message: string
  fieldErrors?: Record<string, string>
}

export const initialApplicationState: ApplicationState = {
  status: 'idle',
  message: '',
}

const value = (formData: FormData, key: string) => {
  const field = formData.get(key)
  return typeof field === 'string' ? field.trim() : ''
}

export async function submitApplication(
  _previous: ApplicationState,
  formData: FormData,
): Promise<ApplicationState> {
  const user = await getCurrentUser()
  if (!user) return { status: 'error', message: 'Sign in to submit an application.' }

  const type = value(formData, 'type')
  const businessName = value(formData, 'businessName')
  const website = value(formData, 'website')
  const country = value(formData, 'country')
  const phone = value(formData, 'phone')
  const experience = value(formData, 'experience')
  const specialties = value(formData, 'specialties')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12)
  const fieldErrors: Record<string, string> = {}

  if (type !== 'agent' && type !== 'agency') {
    fieldErrors.type = 'Choose agent or agency.'
  }
  if (businessName.length < 2 || businessName.length > 160) {
    fieldErrors.businessName = 'Enter a valid business or professional name.'
  }
  if (country.length < 2 || country.length > 120) {
    fieldErrors.country = 'Enter your operating country.'
  }
  if (phone.length < 5 || phone.length > 50) {
    fieldErrors.phone = 'Enter a valid contact number.'
  }
  if (experience.length < 40 || experience.length > 3000) {
    fieldErrors.experience = 'Describe your experience in at least 40 characters.'
  }
  if (website.length > 300) fieldErrors.website = 'Website URL is too long.'

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: 'error',
      message: 'Please check the highlighted fields.',
      fieldErrors,
    }
  }
  const applicationType = type as 'agent' | 'agency'

  const payload = await getPayloadClient()
  const existing = await payload.find({
    collection: 'applications',
    user,
    overrideAccess: false,
    where: {
      and: [
        { owner: { equals: user.id } },
        {
          status: {
            in: ['submitted', 'review', 'approved', 'changes-requested', 'declined'],
          },
        },
      ],
    },
    limit: 1,
  })
  const current = existing.docs[0]
  if (current && !['changes-requested', 'declined'].includes(current.status ?? 'submitted')) {
    return {
      status: 'error',
      message: 'You already have an active application.',
    }
  }

  try {
    const data = {
      type: applicationType,
      businessName,
      website: website || undefined,
      country,
      phone,
      experience,
      specialties: specialties.map((name) => ({ name })),
    } as never
    if (current) {
      await payload.update({
        collection: 'applications',
        id: current.id,
        user,
        overrideAccess: false,
        data,
      })
    } else {
      await payload.create({
        collection: 'applications',
        user,
        overrideAccess: false,
        draft: false,
        data,
      })
    }
    return {
      status: 'success',
      message:
        'Application submitted. Your role will be activated after the Masidy trust team approves it.',
    }
  } catch {
    return {
      status: 'error',
      message: 'The application could not be submitted. Please try again.',
    }
  }
}
