import 'server-only'

import { auth } from '@/auth'
import { getPayloadClient } from '@/lib/payload'

export async function getCurrentUser() {
  const session = await auth()
  if (!session?.user?.id) return null
  const payload = await getPayloadClient()
  try {
    return await payload.findByID({
      collection: 'users',
      id: session.user.id,
      overrideAccess: true,
    })
  } catch {
    return null
  }
}
