'use server'

import { getPayloadClient } from '@/lib/payload'
import { enforceRateLimit } from '@/lib/rate-limit'

export type BookingActionState = {
  status: 'idle' | 'success' | 'error'
  message: string
  fieldErrors?: Record<string, string>
}

export const initialBookingState: BookingActionState = {
  status: 'idle',
  message: '',
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const textValue = (formData: FormData, name: string) => {
  const value = formData.get(name)
  return typeof value === 'string' ? value.trim() : ''
}

export async function createBookingRequest(
  _previousState: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const travelerName = textValue(formData, 'travelerName')
  const email = textValue(formData, 'email').toLowerCase()
  const phone = textValue(formData, 'phone')
  const trip = textValue(formData, 'trip')
  const preferredMonth = textValue(formData, 'preferredMonth')
  const note = textValue(formData, 'note')
  const travelers = Number(textValue(formData, 'travelers'))
  const captchaToken = textValue(formData, 'captchaToken')
  const fieldErrors: Record<string, string> = {}

  if (travelerName.length < 2 || travelerName.length > 120) {
    fieldErrors.travelerName = 'Enter your full name.'
  }
  if (!emailPattern.test(email)) {
    fieldErrors.email = 'Enter a valid email address.'
  }
  if (!trip) {
    fieldErrors.trip = 'Choose a journey.'
  }
  if (!Number.isInteger(travelers) || travelers < 1 || travelers > 20) {
    fieldErrors.travelers = 'Choose between 1 and 20 travelers.'
  }
  if (!preferredMonth || preferredMonth.length > 40) {
    fieldErrors.preferredMonth = 'Tell us when you would like to travel.'
  }
  if (phone.length > 40) fieldErrors.phone = 'Phone number is too long.'
  if (note.length > 1200) fieldErrors.note = 'Keep your note under 1,200 characters.'

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: 'error',
      message: 'Please check the highlighted fields.',
      fieldErrors,
    }
  }

  try {
    await enforceRateLimit(email, 'booking-request', 5, 60 * 60 * 1000)
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY
    if (!turnstileSecret || !captchaToken) {
      return {
        status: 'error',
        message: 'Human verification is not configured or incomplete.',
      }
    }
    const verification = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: turnstileSecret,
        response: captchaToken,
      }),
      signal: AbortSignal.timeout(10_000),
    })
    const challenge = (await verification.json()) as { success?: boolean }
    if (!verification.ok || !challenge.success) {
      return {
        status: 'error',
        message: 'Human verification failed. Please try again.',
      }
    }
    const payload = await getPayloadClient()
    await payload.create({
      collection: 'booking-requests',
      overrideAccess: false,
      draft: false,
      context: { verifiedPublicSubmission: true },
      data: {
        travelerName,
        email,
        phone: phone || undefined,
        trip,
        travelers,
        preferredMonth,
        note: note || undefined,
      },
    })

    return {
      status: 'success',
      message: 'Your journey request is in. A Masidy partner will contact you shortly.',
    }
  } catch {
    return {
      status: 'error',
      message: 'We could not send your request. Please try again.',
    }
  }
}
