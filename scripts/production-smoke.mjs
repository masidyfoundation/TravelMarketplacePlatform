import assert from 'node:assert/strict'

const base = `http://127.0.0.1:${process.env.PORT || 3000}`

async function expect(path, status) {
  const response = await fetch(`${base}${path}`, { redirect: 'manual' })
  assert.equal(response.status, status, `${path} returned ${response.status}`)
  return response
}

await expect('/', 200)
await expect('/demo', 200)
await expect('/login', 200)
await expect('/legal/terms', 200)
await expect('/legal/privacy', 200)
await expect('/legal/cancellations', 200)
await expect('/trips/patagonia-at-the-edge', 404)
await expect('/agencies/meridian-wild', 404)
await expect('/consent', 307)
await expect('/dashboard', 307)
await expect('/dashboard/operations', 307)
await expect('/dashboard/finance', 307)
await expect('/dashboard/privacy', 307)
await expect('/studio', 307)
await expect('/api/saved-trips', 401)

const health = await expect('/api/health', 200)
const body = await health.json()
assert.equal(body.status, 'ok')

console.log('Production smoke checks passed.')
