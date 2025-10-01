import { test, expect } from '@playwright/test'

test('healthz ok', async ({ request }) => {
  const res = await request.get('/healthz')
  expect(res.status()).toBe(200)
  const json = await res.json()
  expect(json.ok).toBe(true)
})
