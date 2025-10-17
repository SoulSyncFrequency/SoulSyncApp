import { test, expect } from '@playwright/test'

// Placeholder: validate that /api/openapi.json is reachable and contains basic keys
test('OpenAPI provider reachable', async ({ request }) => {
  const res = await request.get('/api/openapi.json')
  expect(res.status()).toBe(200)
  const j = await res.json()
  expect(j).toHaveProperty('openapi')
  expect(j).toHaveProperty('paths')
})
