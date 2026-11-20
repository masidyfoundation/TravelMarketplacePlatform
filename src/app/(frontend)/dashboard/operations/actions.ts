'use server'

import { getCurrentUser } from '@/lib/current-user'
import { getPayloadClient } from '@/lib/payload'

export type OperationState = {
  status: 'idle' | 'success' | 'error'
  message: string
}

export const initialOperationState: OperationState = {
  status: 'idle',
  message: '',
}

const text = (data: FormData, key: string) => {
  const value = data.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

export async function saveTravelerProfile(
  _state: OperationState,
  data: FormData,
): Promise<OperationState> {
  const user = await getCurrentUser()
  if (!user) return { status: 'error', message: 'Sign in to continue.' }
  const id = text(data, 'id')
  const fullName = text(data, 'fullName')
  const passportLastFour = text(data, 'passportLastFour')
  if (fullName.length < 2 || (passportLastFour && !/^[A-Za-z0-9]{4}$/.test(passportLastFour))) {
    return { status: 'error', message: 'Check the traveler name and passport digits.' }
  }
  const payload = await getPayloadClient()
  const profile = {
    fullName,
    dateOfBirth: text(data, 'dateOfBirth') || undefined,
    nationality: text(data, 'nationality') || undefined,
    passportLastFour: passportLastFour || undefined,
    passportExpiry: text(data, 'passportExpiry') || undefined,
    dietaryNeeds: text(data, 'dietaryNeeds') || undefined,
    accessibilityNeeds: text(data, 'accessibilityNeeds') || undefined,
    emergencyContactName: text(data, 'emergencyContactName') || undefined,
    emergencyContactPhone: text(data, 'emergencyContactPhone') || undefined,
    emergencyContactRelation: text(data, 'emergencyContactRelation') || undefined,
  } as never
  try {
    if (id) {
      await payload.update({
        collection: 'traveler-profiles',
        id,
        user,
        overrideAccess: false,
        data: profile,
      })
    } else {
      await payload.create({
        collection: 'traveler-profiles',
        user,
        overrideAccess: false,
        draft: false,
        data: profile,
      })
    }
    return { status: 'success', message: 'Traveler details saved securely.' }
  } catch {
    return { status: 'error', message: 'Traveler details could not be saved.' }
  }
}

export async function uploadTravelerFile(
  _state: OperationState,
  data: FormData,
): Promise<OperationState> {
  const user = await getCurrentUser()
  if (!user) return { status: 'error', message: 'Sign in to continue.' }
  const file = data.get('file')
  const label = text(data, 'label')
  const documentType = text(data, 'documentType')
  const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
  if (
    !(file instanceof File) ||
    file.size === 0 ||
    file.size > 8_000_000 ||
    !allowed.includes(file.type) ||
    label.length < 2 ||
    !['passport', 'visa', 'insurance', 'medical', 'other'].includes(documentType)
  ) {
    return { status: 'error', message: 'Choose a PDF or image up to 8 MB.' }
  }
  try {
    const scanURL = process.env.FILE_SCAN_API_URL
    const scanKey = process.env.FILE_SCAN_API_KEY
    if (!scanURL || !scanKey) {
      return {
        status: 'error',
        message: 'Private upload scanning is ready for provider configuration.',
      }
    }
    const scanBody = new FormData()
    scanBody.set('file', file)
    const scan = await fetch(scanURL, {
      method: 'POST',
      headers: { authorization: `Bearer ${scanKey}` },
      body: scanBody,
      signal: AbortSignal.timeout(20_000),
    })
    const scanResult = (await scan.json().catch(() => null)) as { clean?: boolean } | null
    if (!scan.ok || scanResult?.clean !== true) {
      return {
        status: 'error',
        message: 'The file did not pass security scanning.',
      }
    }
    const payload = await getPayloadClient()
    const bytes = Buffer.from(await file.arrayBuffer())
    await payload.create({
      collection: 'traveler-files',
      user,
      overrideAccess: false,
      draft: false,
      file: {
        data: bytes,
        mimetype: file.type,
        name: file.name,
        size: file.size,
      },
      data: {
        label,
        documentType,
        expiresAt: text(data, 'expiresAt') || undefined,
      } as never,
    })
    return { status: 'success', message: 'Travel document uploaded privately.' }
  } catch {
    return { status: 'error', message: 'The document could not be uploaded.' }
  }
}

export async function createProposal(
  _state: OperationState,
  data: FormData,
): Promise<OperationState> {
  const user = await getCurrentUser()
  if (!user || user.role !== 'agent') {
    return { status: 'error', message: 'Verified agent access is required.' }
  }
  const travelers = Number(text(data, 'travelers'))
  const amount = Number(text(data, 'amount'))
  if (!Number.isInteger(travelers) || travelers < 1 || !Number.isFinite(amount) || amount < 0) {
    return { status: 'error', message: 'Check the travelers and quote amount.' }
  }
  try {
    const payload = await getPayloadClient()
    await payload.create({
      collection: 'proposals',
      user,
      overrideAccess: false,
      draft: false,
      data: {
        travelerName: text(data, 'travelerName'),
        travelerEmail: text(data, 'travelerEmail'),
        trip: text(data, 'trip'),
        travelers,
        amount,
        currency: text(data, 'currency'),
        validUntil: text(data, 'validUntil'),
        message: text(data, 'message'),
      } as never,
    })
    return { status: 'success', message: 'Proposal saved as a draft.' }
  } catch {
    return { status: 'error', message: 'The proposal could not be created.' }
  }
}

export async function sendProposal(
  _state: OperationState,
  data: FormData,
): Promise<OperationState> {
  const user = await getCurrentUser()
  if (!user || user.role !== 'agent') {
    return { status: 'error', message: 'Verified agent access is required.' }
  }
  try {
    const payload = await getPayloadClient()
    await payload.update({
      collection: 'proposals',
      id: text(data, 'id'),
      user,
      overrideAccess: false,
      data: { status: 'sent' },
    })
    return { status: 'success', message: 'Proposal marked as sent.' }
  } catch {
    return { status: 'error', message: 'The proposal could not be sent.' }
  }
}

export async function requestOrderChange(
  _state: OperationState,
  data: FormData,
): Promise<OperationState> {
  const user = await getCurrentUser()
  if (!user) return { status: 'error', message: 'Sign in to continue.' }
  const details = text(data, 'details')
  if (details.length < 20) {
    return { status: 'error', message: 'Describe the requested change in more detail.' }
  }
  try {
    const payload = await getPayloadClient()
    await payload.create({
      collection: 'order-changes',
      user,
      overrideAccess: false,
      draft: false,
      data: {
        order: text(data, 'order'),
        type: text(data, 'type'),
        details,
      } as never,
    })
    return { status: 'success', message: 'Your request was sent to operations.' }
  } catch {
    return { status: 'error', message: 'The request could not be submitted.' }
  }
}

export async function joinWaitlist(
  _state: OperationState,
  data: FormData,
): Promise<OperationState> {
  const user = await getCurrentUser()
  if (!user) return { status: 'error', message: 'Sign in to continue.' }
  const travelers = Number(text(data, 'travelers'))
  if (!Number.isInteger(travelers) || travelers < 1 || travelers > 20) {
    return { status: 'error', message: 'Choose a valid traveler count.' }
  }
  try {
    const payload = await getPayloadClient()
    await payload.create({
      collection: 'waitlists',
      user,
      overrideAccess: false,
      draft: false,
      data: {
        departure: text(data, 'departure'),
        travelers,
        note: text(data, 'note') || undefined,
      } as never,
    })
    return { status: 'success', message: 'You joined the departure waitlist.' }
  } catch {
    return { status: 'error', message: 'You may already be on this waitlist.' }
  }
}

export async function sendOrderMessage(
  _state: OperationState,
  data: FormData,
): Promise<OperationState> {
  const user = await getCurrentUser()
  if (!user) return { status: 'error', message: 'Sign in to continue.' }
  const payload = await getPayloadClient()
  let conversationID = text(data, 'conversation')
  try {
    if (!conversationID) {
      const conversation = await payload.create({
        collection: 'conversations',
        user,
        overrideAccess: false,
        draft: false,
        data: {
          order: text(data, 'order'),
          subject: text(data, 'subject'),
        } as never,
      })
      conversationID = String(conversation.id)
    }
    await payload.create({
      collection: 'messages',
      user,
      overrideAccess: false,
      draft: false,
      data: {
        conversation: conversationID,
        body: text(data, 'body'),
      } as never,
    })
    return { status: 'success', message: 'Message sent securely.' }
  } catch {
    return { status: 'error', message: 'The message could not be sent.' }
  }
}
