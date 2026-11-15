import 'server-only'

export async function sendTransactionalEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  const key = process.env.RESEND_API_KEY
  const from = process.env.TRANSACTIONAL_EMAIL_FROM
  if (!key || !from) return { configured: false }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${key}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  })
  if (!response.ok) throw new Error('Transactional email delivery failed.')
  return { configured: true }
}
