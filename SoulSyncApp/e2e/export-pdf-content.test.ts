import request from 'supertest'
import { app } from '../backend/src/server'

describe('Admin export PDF', () => {
  it('should not 400 and prefer application/pdf content-type when valid query', async () => {
    const from = new Date(Date.now()-3600*1000).toISOString()
    const to = new Date().toISOString()
    const res = await request(app).get(`/api/admin/dashboard/export-pdf?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
    expect([200,401,403]).toContain(res.status)
    if (res.status === 200 && res.headers['content-type']) {
      expect(res.headers['content-type']).toMatch(/pdf|octet-stream/)
    }
  })
})
