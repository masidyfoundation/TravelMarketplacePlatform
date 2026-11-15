'use server'

import { getCurrentUser } from '@/lib/current-user'
import { getPayloadClient } from '@/lib/payload'

export type RefundState = {
  status: 'idle' | 'success' | 'error'
  message: string
}

export const initialRefundState: RefundState = { status: 'idle', message: '' }

export async function requestRefund(_state: RefundState, formData: FormData): Promise<RefundState> {
  const user = await getCurrentUser()
  if (!user) return { status: 'error', message: 'Sign in to continue.' }
  const order = String(formData.get('order') ?? '')
  const amount = Number(formData.get('amount'))
  const reason = String(formData.get('reason') ?? '').trim()
  if (!order || !Number.isFinite(amount) || amount <= 0 || reason.length < 20) {
    return { status: 'error', message: 'Check the order, amount, and reason.' }
  }
  try {
    const payload = await getPayloadClient()
    await payload.create({
      collection: 'refund-requests',
      user,
      overrideAccess: false,
      draft: false,
      data: { order, amount, reason } as never,
    })
    return {
      status: 'success',
      message: 'Refund request submitted for operations review.',
    }
  } catch {
    return {
      status: 'error',
      message: 'The refund request could not be submitted.',
    }
  }
}
