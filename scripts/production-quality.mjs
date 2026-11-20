import assert from 'node:assert/strict'
import { performance } from 'node:perf_hooks'
import Stripe from 'stripe'

const base = `http://127.0.0.1:${process.env.PORT || 3000}`

async function page(path) {
  const response = await fetch(`${base}${path}`, { redirect: 'manual' })
  return { response, html: await response.text() }
}

for (const path of [
  '/',
  '/demo',
  '/login',
  '/legal/terms',
  '/legal/privacy',
  '/legal/cancellations',
]) {
  const { response, html } = await page(path)
  assert.equal(response.status, 200, `${path} must render`)
  assert.match(html, /<title/i, `${path} needs a document title`)
  assert.match(html, /<main/i, `${path} needs a main landmark`)
  assert.match(html, /<h1/i, `${path} needs a primary heading`)
  const images = html.match(/<img\b[^>]*>/gi) ?? []
  for (const image of images) {
    assert.match(image, /\balt=/i, `${path} contains an image without alt`)
  }
  if (path === '/demo') {
    assert.match(html, /Patagonia at the Edge/, '/demo must include sample inventory')
  }
  if (path === '/') {
    assert.match(html, /Demo · not bookable/, 'homepage must label sample inventory as demo')
    assert.match(html, /Patagonia at the Edge/, 'homepage must include demo trip imagery')
    assert.doesNotMatch(
      html,
      /href="\/trips\/patagonia-at-the-edge"/,
      'homepage demo cards must not link to bookable trip pages',
    )
  }
}

for (const path of ['/trips/patagonia-at-the-edge', '/agencies/meridian-wild']) {
  const response = await fetch(`${base}${path}`, { redirect: 'manual' })
  assert.equal(response.status, 404, `${path} must not expose demo inventory`)
}

for (const path of [
  '/consent',
  '/dashboard',
  '/dashboard/operations',
  '/dashboard/finance',
  '/dashboard/privacy',
  '/studio',
]) {
  const response = await fetch(`${base}${path}`, { redirect: 'manual' })
  assert.equal(response.status, 307, `${path} must reject anonymous access`)
  assert.equal(response.headers.get('location'), '/login')
}

const cron = await fetch(`${base}/api/cron/notifications`, { method: 'POST' })
assert.equal(cron.status, 401, 'cron endpoint must require its bearer secret')

const webhook = await fetch(`${base}/api/payments/webhook`, { method: 'POST' })
assert.equal(webhook.status, 400, 'configured Stripe webhook must reject unsigned requests')

const providers = await fetch(`${base}/api/auth/providers`)
assert.equal(providers.status, 200, 'authentication providers must be available')
const providerBody = await providers.json()
assert.ok(providerBody.google, 'Google authentication must be configured')
assert.equal(providerBody.resend, undefined, 'unavailable magic-link authentication must be hidden')

const authErrorPage = await page('/login?error=Configuration')
assert.equal(authErrorPage.response.status, 200, 'authentication errors must return to login')
assert.match(
  authErrorPage.html,
  /Google sign-in couldn(?:&#x27;|')t be completed/,
  'Google authentication failures must be visible to the user',
)
assert.doesNotMatch(authErrorPage.html, /sign-in link|Email me/, 'magic-link UI must be removed')

if (process.env.STRIPE_WEBHOOK_SECRET) {
  const payload = JSON.stringify({
    id: 'evt_masidy_delivery_check',
    object: 'event',
    api_version: '2025-12-15.clover',
    created: Math.floor(Date.now() / 1000),
    data: { object: {} },
    livemode: false,
    pending_webhooks: 1,
    request: null,
    type: 'ping',
  })
  const signature = Stripe.webhooks.generateTestHeaderString({
    payload,
    secret: process.env.STRIPE_WEBHOOK_SECRET,
  })
  const signed = await fetch(`${base}/api/payments/webhook`, {
    method: 'POST',
    headers: { 'stripe-signature': signature },
    body: payload,
  })
  assert.equal(signed.status, 200, 'signed Stripe webhook must be accepted')
}

const timings = await Promise.all(
  Array.from({ length: 20 }, async () => {
    const started = performance.now()
    const response = await fetch(`${base}/`)
    assert.equal(response.status, 200)
    return performance.now() - started
  }),
)
timings.sort((a, b) => a - b)
const p95 = timings[Math.floor(timings.length * 0.95) - 1]
assert.ok(p95 < 5000, `homepage p95 exceeded 5 seconds: ${p95.toFixed(0)}ms`)

console.log(`Production quality checks passed. Homepage p95 ${p95.toFixed(0)}ms.`)
