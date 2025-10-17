import { test, expect } from '@playwright/test'

const base = process.env.E2E_BASE_URL

test.describe('Smoke', () => {
  test.skip(!base, 'E2E_BASE_URL not set')

  test('livez & readyz', async ({ request }) => {
    const r1 = await request.get(`${base}/livez`)
    expect(r1.status()).toBe(200)
    const r2 = await request.get(`${base}/readyz`)
    expect(r2.status()).toBe(200)
  })
})
