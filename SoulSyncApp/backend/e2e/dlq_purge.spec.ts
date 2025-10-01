import { test, expect } from '@playwright/test'

test('DLQ purge with CSRF works', async ({ request }) => {
  // fetch csrf
  const ct = await request.get('/admin/csrf')
  expect(ct.status()).toBe(200)
  const token = (await ct.json()).csrfToken
  // try purge (requires queue present, will still return JSON)
  const res = await request.post('/admin/queues/testq/dlq?days=0', {
    headers: { 'x-admin-token': process.env.ADMIN_TOKEN || 'changeme', 'x-csrf-token': token }
  })
  expect(res.status()).toBe(200)
  const js = await res.json()
  expect(js).toHaveProperty('purged')
})
