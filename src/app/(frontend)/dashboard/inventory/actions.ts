'use server'

import { getCurrentUser } from '@/lib/current-user'
import { getPayloadClient } from '@/lib/payload'

export type InventoryState = {
  status: 'idle' | 'success' | 'error'
  message: string
}

export const initialInventoryState: InventoryState = {
  status: 'idle',
  message: '',
}

const text = (formData: FormData, key: string) => {
  const entry = formData.get(key)
  return typeof entry === 'string' ? entry.trim() : ''
}

const number = (formData: FormData, key: string) => {
  const parsed = Number(text(formData, key))
  return Number.isFinite(parsed) ? parsed : NaN
}

async function agencyUser() {
  const user = await getCurrentUser()
  return user?.role === 'agency' ? user : null
}

export async function createDeparture(
  _previous: InventoryState,
  formData: FormData,
): Promise<InventoryState> {
  const user = await agencyUser()
  if (!user) return { status: 'error', message: 'Agency access is required.' }

  const trip = text(formData, 'trip')
  const label = text(formData, 'label')
  const startDate = text(formData, 'startDate')
  const endDate = text(formData, 'endDate')
  const capacity = number(formData, 'capacity')
  const priceOverride = number(formData, 'priceOverride')
  if (
    !trip ||
    label.length < 3 ||
    !startDate ||
    !endDate ||
    new Date(endDate) < new Date(startDate) ||
    !Number.isInteger(capacity) ||
    capacity < 1
  ) {
    return {
      status: 'error',
      message: 'Check the trip, label, dates, and capacity before saving.',
    }
  }

  try {
    const payload = await getPayloadClient()
    await payload.create({
      collection: 'departures',
      user,
      overrideAccess: false,
      data: {
        trip,
        label,
        startDate,
        endDate,
        capacity,
        booked: 0,
        status: 'open',
        ...(!Number.isNaN(priceOverride) && priceOverride >= 0 ? { priceOverride } : {}),
      },
    })
    return { status: 'success', message: 'Departure added to your inventory.' }
  } catch {
    return {
      status: 'error',
      message: 'The departure could not be added. Confirm that you manage this trip.',
    }
  }
}

export async function updateDeparture(
  _previous: InventoryState,
  formData: FormData,
): Promise<InventoryState> {
  const user = await agencyUser()
  if (!user) return { status: 'error', message: 'Agency access is required.' }
  const id = text(formData, 'id')
  const status = text(formData, 'status')
  const capacity = number(formData, 'capacity')
  const booked = number(formData, 'booked')
  if (
    !id ||
    !['open', 'guaranteed', 'sold-out', 'closed', 'cancelled'].includes(status) ||
    !Number.isInteger(capacity) ||
    capacity < 1 ||
    !Number.isInteger(booked) ||
    booked < 0 ||
    booked > capacity
  ) {
    return { status: 'error', message: 'Capacity and booked places are invalid.' }
  }
  try {
    const payload = await getPayloadClient()
    await payload.update({
      collection: 'departures',
      id,
      user,
      overrideAccess: false,
      data: {
        status: status as 'open' | 'guaranteed' | 'sold-out' | 'closed' | 'cancelled',
        capacity,
        booked,
      },
    })
    return { status: 'success', message: 'Departure inventory updated.' }
  } catch {
    return { status: 'error', message: 'This departure could not be updated.' }
  }
}

export async function updateTripStatus(
  _previous: InventoryState,
  formData: FormData,
): Promise<InventoryState> {
  const user = await agencyUser()
  if (!user) return { status: 'error', message: 'Agency access is required.' }
  const id = text(formData, 'id')
  const status = text(formData, 'status')
  if (!id || !['draft', 'active', 'paused'].includes(status)) {
    return { status: 'error', message: 'Choose a valid publishing status.' }
  }
  try {
    const payload = await getPayloadClient()
    await payload.update({
      collection: 'trips',
      id,
      user,
      overrideAccess: false,
      data: { status: status as 'draft' | 'active' | 'paused' },
    })
    return { status: 'success', message: 'Journey publishing status updated.' }
  } catch {
    return { status: 'error', message: 'This journey could not be updated.' }
  }
}
