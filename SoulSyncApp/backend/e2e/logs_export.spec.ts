import { test, expect } from '@playwright/test'

test('admin logs export CSV/XLSX endpoints accessible', async ({ request }) => {
  // List logs
  const list = await request.get('/admin/logs', { headers: { 'x-admin-token': process.env.ADMIN_TOKEN || 'changeme' } })
  expect(list.status()).toBe(200)
  const data = await list.json()
  if(data.files && data.files.length){
    const file = data.files[0]
    const csv = await request.get(`/admin/logs/${file}.csv`, { headers: { 'x-admin-token': process.env.ADMIN_TOKEN || 'changeme' } })
    expect(csv.status()).toBe(200)
    const text = await csv.text()
    expect(text).toContain('time')
    const xlsx = await request.get(`/admin/logs/${file}.xlsx`, { headers: { 'x-admin-token': process.env.ADMIN_TOKEN || 'changeme' } })
    expect(xlsx.status()).toBe(200)
  }
})
