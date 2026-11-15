'use server'

import { getCurrentUser } from '@/lib/current-user'
import { getPayloadClient } from '@/lib/payload'

export async function savePreferences(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) return
  const locale = String(formData.get('locale') ?? '')
  const preferredCurrency = String(formData.get('preferredCurrency') ?? '')
  const timeZone = String(formData.get('timeZone') ?? '').trim()
  if (
    !['en', 'es', 'fr', 'de', 'it', 'pt', 'ar', 'ja'].includes(locale) ||
    !['USD', 'EUR', 'GBP', 'AED'].includes(preferredCurrency) ||
    !Intl.supportedValuesOf('timeZone').includes(timeZone)
  ) {
    return
  }
  const payload = await getPayloadClient()
  await payload.update({
    collection: 'users',
    id: user.id,
    user,
    overrideAccess: false,
    data: {
      locale: locale as 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ar' | 'ja',
      preferredCurrency: preferredCurrency as 'USD' | 'EUR' | 'GBP' | 'AED',
      timeZone,
    },
  })
}
