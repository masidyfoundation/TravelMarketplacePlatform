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

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const validWebsite = (website: string) => {
  try {
    return ['http:', 'https:'].includes(new URL(website).protocol)
  } catch {
    return false
  }
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

export async function saveAgencyProfile(
  _previous: InventoryState,
  formData: FormData,
): Promise<InventoryState> {
  const user = await agencyUser()
  if (!user) return { status: 'error', message: 'Agency access is required.' }
  const id = text(formData, 'id')
  const name = text(formData, 'name')
  const slug = text(formData, 'slug').toLowerCase()
  const location = text(formData, 'location')
  const specialty = text(formData, 'specialty')
  const description = text(formData, 'description')
  const website = text(formData, 'website')
  const contactEmail = text(formData, 'contactEmail').toLowerCase()
  const supportPhone = text(formData, 'supportPhone')
  const languages = text(formData, 'languages')
    .split(',')
    .map((language) => language.trim())
    .filter(Boolean)
    .slice(0, 20)
  const licenses = text(formData, 'licenses')
    .split('\n')
    .map((line) => line.split('|').map((part) => part.trim()))
    .filter(([authority, licenseNumber]) => authority && licenseNumber)
    .slice(0, 20)
  const coverImage = formData.get('coverImage')
  const hasCoverImage = coverImage instanceof File && coverImage.size > 0
  const validCoverImage =
    !hasCoverImage ||
    (coverImage.size <= 8_000_000 &&
      ['image/jpeg', 'image/png', 'image/webp'].includes(coverImage.type))
  if (
    !id ||
    name.length < 2 ||
    !slugPattern.test(slug) ||
    location.length < 2 ||
    specialty.length < 2 ||
    description.length < 40 ||
    !validWebsite(website) ||
    !emailPattern.test(contactEmail) ||
    supportPhone.length < 5 ||
    !validCoverImage
  ) {
    return {
      status: 'error',
      message: 'Complete the business name, URL, location, description, website, email and phone.',
    }
  }
  try {
    const payload = await getPayloadClient()
    const media = hasCoverImage
      ? await payload.create({
          collection: 'media',
          user,
          overrideAccess: false,
          draft: false,
          file: {
            data: Buffer.from(await coverImage.arrayBuffer()),
            mimetype: coverImage.type,
            name: coverImage.name,
            size: coverImage.size,
          },
          data: { alt: `${name} cover image` },
        })
      : null
    await payload.update({
      collection: 'agencies',
      id,
      user,
      overrideAccess: false,
      data: {
        name,
        slug,
        location,
        specialty,
        description,
        website,
        contactEmail,
        supportPhone,
        languages: languages.map((language) => ({ language })),
        licenses: licenses.map(([authority, licenseNumber]) => ({
          authority,
          number: licenseNumber,
        })),
        ...(media ? { coverImage: media.id } : {}),
      },
    })
    return {
      status: 'success',
      message: 'Agency profile saved. Complete payouts and media before staff verification.',
    }
  } catch {
    return { status: 'error', message: 'The agency profile could not be saved.' }
  }
}

export async function createTrip(
  _previous: InventoryState,
  formData: FormData,
): Promise<InventoryState> {
  const user = await agencyUser()
  if (!user) return { status: 'error', message: 'Agency access is required.' }
  const agency = text(formData, 'agency')
  const title = text(formData, 'title')
  const slug = text(formData, 'slug').toLowerCase()
  const destination = text(formData, 'destination')
  const country = text(formData, 'country')
  const category = text(formData, 'category')
  const durationDays = number(formData, 'durationDays')
  const price = number(formData, 'price')
  const currency = text(formData, 'currency')
  const agentCommission = number(formData, 'agentCommission')
  const tagline = text(formData, 'tagline')
  const summary = text(formData, 'summary')
  const cancellationPolicy = text(formData, 'cancellationPolicy')
  const accommodation = text(formData, 'accommodation')
  const transport = text(formData, 'transport')
  const meetingPoint = text(formData, 'meetingPoint')
  const highlights = text(formData, 'highlights')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 12)
  const inclusions = text(formData, 'inclusions')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const itinerary = text(formData, 'itinerary')
    .split('\n')
    .map((line) => line.split('|').map((part) => part.trim()))
    .filter(([day, dayTitle, description]) => Number(day) > 0 && dayTitle && description)
    .slice(0, 30)
  const image = formData.get('heroImage')
  const categories = ['beach', 'culture', 'adventure', 'wellness', 'luxury']
  const currencies = ['USD', 'EUR', 'GBP', 'AED']
  const allowedImages = ['image/jpeg', 'image/png', 'image/webp']
  if (
    !agency ||
    title.length < 3 ||
    !slugPattern.test(slug) ||
    destination.length < 2 ||
    country.length < 2 ||
    !categories.includes(category) ||
    !Number.isInteger(durationDays) ||
    durationDays < 1 ||
    !Number.isFinite(price) ||
    price < 0 ||
    !currencies.includes(currency) ||
    !Number.isFinite(agentCommission) ||
    agentCommission < 0 ||
    agentCommission > 50 ||
    tagline.length < 10 ||
    summary.length < 40 ||
    cancellationPolicy.length < 40 ||
    !(image instanceof File) ||
    image.size === 0 ||
    image.size > 8_000_000 ||
    !allowedImages.includes(image.type)
  ) {
    return {
      status: 'error',
      message: 'Complete all trip fields and choose a JPG, PNG or WebP image up to 8 MB.',
    }
  }
  try {
    const payload = await getPayloadClient()
    const media = await payload.create({
      collection: 'media',
      user,
      overrideAccess: false,
      draft: false,
      file: {
        data: Buffer.from(await image.arrayBuffer()),
        mimetype: image.type,
        name: image.name,
        size: image.size,
      },
      data: { alt: `${title} in ${destination}` },
    })
    await payload.create({
      collection: 'trips',
      user,
      overrideAccess: false,
      draft: false,
      data: {
        agency,
        title,
        slug,
        destination,
        country,
        category: category as 'beach' | 'culture' | 'adventure' | 'wellness' | 'luxury',
        heroImage: media.id,
        durationDays,
        price,
        currency: currency as 'USD' | 'EUR' | 'GBP' | 'AED',
        rating: 0,
        reviewCount: 0,
        agentCommission,
        tagline,
        summary,
        cancellationPolicy,
        accommodation: accommodation || undefined,
        transport: transport || undefined,
        meetingPoint: meetingPoint || undefined,
        highlights: highlights.map((item) => ({ title: item })),
        itinerary: itinerary.map(([day, dayTitle, description]) => ({
          day: Number(day),
          title: dayTitle,
          description,
        })),
        inclusions: inclusions.map((item) => ({ item })),
        status: 'draft',
      },
    })
    return {
      status: 'success',
      message: 'Trip draft created. Add an itinerary and departure, then submit it for review.',
    }
  } catch {
    return { status: 'error', message: 'The trip draft could not be created.' }
  }
}

export async function updateTripDetails(
  _previous: InventoryState,
  formData: FormData,
): Promise<InventoryState> {
  const user = await agencyUser()
  if (!user) return { status: 'error', message: 'Agency access is required.' }
  const id = text(formData, 'id')
  const title = text(formData, 'title')
  const slug = text(formData, 'slug').toLowerCase()
  const destination = text(formData, 'destination')
  const country = text(formData, 'country')
  const category = text(formData, 'category')
  const durationDays = number(formData, 'durationDays')
  const price = number(formData, 'price')
  const currency = text(formData, 'currency')
  const agentCommission = number(formData, 'agentCommission')
  const tagline = text(formData, 'tagline')
  const summary = text(formData, 'summary')
  const cancellationPolicy = text(formData, 'cancellationPolicy')
  const accommodation = text(formData, 'accommodation')
  const transport = text(formData, 'transport')
  const meetingPoint = text(formData, 'meetingPoint')
  const highlights = text(formData, 'highlights')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 12)
  const inclusions = text(formData, 'inclusions')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const itinerary = text(formData, 'itinerary')
    .split('\n')
    .map((line) => line.split('|').map((part) => part.trim()))
    .filter(([day, dayTitle, description]) => Number(day) > 0 && dayTitle && description)
    .slice(0, 30)
  const image = formData.get('heroImage')
  const hasImage = image instanceof File && image.size > 0
  const validImage =
    !hasImage ||
    (image.size <= 8_000_000 && ['image/jpeg', 'image/png', 'image/webp'].includes(image.type))
  if (
    !id ||
    title.length < 3 ||
    !slugPattern.test(slug) ||
    destination.length < 2 ||
    country.length < 2 ||
    !['beach', 'culture', 'adventure', 'wellness', 'luxury'].includes(category) ||
    !Number.isInteger(durationDays) ||
    durationDays < 1 ||
    !Number.isFinite(price) ||
    price < 0 ||
    !['USD', 'EUR', 'GBP', 'AED'].includes(currency) ||
    !Number.isFinite(agentCommission) ||
    agentCommission < 0 ||
    agentCommission > 50 ||
    tagline.length < 10 ||
    summary.length < 40 ||
    cancellationPolicy.length < 40 ||
    highlights.length === 0 ||
    inclusions.length === 0 ||
    itinerary.length === 0 ||
    !accommodation ||
    !transport ||
    !meetingPoint ||
    !validImage
  ) {
    return {
      status: 'error',
      message: 'Complete the trip, logistics, itinerary, inclusions and cancellation terms.',
    }
  }
  try {
    const payload = await getPayloadClient()
    const media = hasImage
      ? await payload.create({
          collection: 'media',
          user,
          overrideAccess: false,
          draft: false,
          file: {
            data: Buffer.from(await image.arrayBuffer()),
            mimetype: image.type,
            name: image.name,
            size: image.size,
          },
          data: { alt: `${title} in ${destination}` },
        })
      : null
    await payload.update({
      collection: 'trips',
      id,
      user,
      overrideAccess: false,
      data: {
        title,
        slug,
        destination,
        country,
        category: category as 'beach' | 'culture' | 'adventure' | 'wellness' | 'luxury',
        durationDays,
        price,
        currency: currency as 'USD' | 'EUR' | 'GBP' | 'AED',
        agentCommission,
        tagline,
        summary,
        cancellationPolicy,
        accommodation,
        transport,
        meetingPoint,
        highlights: highlights.map((item) => ({ title: item })),
        itinerary: itinerary.map(([day, dayTitle, description]) => ({
          day: Number(day),
          title: dayTitle,
          description,
        })),
        inclusions: inclusions.map((item) => ({ item })),
        ...(media ? { heroImage: media.id } : {}),
      },
    })
    return { status: 'success', message: 'Trip details saved.' }
  } catch {
    return { status: 'error', message: 'The trip details could not be saved.' }
  }
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
  if (!id || !['draft', 'review', 'paused'].includes(status)) {
    return { status: 'error', message: 'Choose a valid publishing status.' }
  }
  try {
    const payload = await getPayloadClient()
    await payload.update({
      collection: 'trips',
      id,
      user,
      overrideAccess: false,
      data: { status: status as 'draft' | 'review' | 'paused' },
    })
    return { status: 'success', message: 'Journey publishing status updated.' }
  } catch {
    return { status: 'error', message: 'This journey could not be updated.' }
  }
}
