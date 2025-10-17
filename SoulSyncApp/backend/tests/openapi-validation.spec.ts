import { test, expect } from '@playwright/test'

test('OpenAPI JSON is valid shape and lists some paths', async ({ request }) => {
  const res = await request.get('/api/openapi.json')
  expect(res.status()).toBe(200)
  const j = await res.json()
  expect(j).toHaveProperty('openapi')
  expect(j).toHaveProperty('paths')
  expect(Object.keys(j.paths).length).toBeGreaterThan(0)
})
