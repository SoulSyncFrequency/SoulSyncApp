import request from 'supertest'
import { app } from '../backend/src/server'

describe('Export PDF query validation', () => {
  it('rejects invalid query params', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard/export-pdf?from=abc&to=def')
    expect(res.status).toBe(400)
  })

  it('accepts valid ISO dates in query params', async () => {
    const from = new Date().toISOString()
    const to = new Date(Date.now() + 3600*1000).toISOString()
    const res = await request(app)
      .get(`/api/admin/dashboard/export-pdf?from=${from}&to=${to}`)
    expect([200,401,403]).toContain(res.status)
  })
})
