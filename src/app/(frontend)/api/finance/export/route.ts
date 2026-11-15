import { getCurrentUser } from '@/lib/current-user'
import { getPayloadClient } from '@/lib/payload'

const csv = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`

export async function GET() {
  const user = await getCurrentUser()
  if (!user || !['agent', 'agency'].includes(user.role)) {
    return new Response('Forbidden', { status: 403 })
  }
  const payload = await getPayloadClient()
  const ledger = await payload.find({
    collection: 'ledger-entries',
    user,
    overrideAccess: false,
    depth: 1,
    limit: 5000,
    sort: '-createdAt',
  })
  const rows = [
    ['Date', 'Type', 'Order', 'Currency', 'Amount'],
    ...ledger.docs.map((entry) => [
      entry.createdAt,
      entry.type,
      typeof entry.order === 'string' ? entry.order : entry.order.reference,
      entry.currency,
      entry.amount,
    ]),
  ]
  return new Response(rows.map((row) => row.map(csv).join(',')).join('\n'), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="masidy-reconciliation.csv"',
    },
  })
}
