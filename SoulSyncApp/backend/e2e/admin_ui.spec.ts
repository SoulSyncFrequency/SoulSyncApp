import { test, expect } from '@playwright/test'

test('admin UI serves HTML without auth (token is typed in the page)', async ({ request }) => {
  const res = await request.get('/admin/queues/ui')
  expect(res.status()).toBe(200)
  const html = await res.text()
  expect(html).toContain('<title>Queues Admin</title>')
})

test('csrf endpoint returns JSON', async ({ request }) => {
  const res = await request.get('/admin/csrf')
  expect(res.status()).toBe(200)
  const json = await res.json()
  expect(json).toHaveProperty('csrfToken')
})

test('metrics endpoint available', async ({ request }) => {
  const res = await request.get('/metrics')
  expect(res.status()).toBe(200)
  const text = await res.text()
  expect(text).toContain('# HELP')
})
