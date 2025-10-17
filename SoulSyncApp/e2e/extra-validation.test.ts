import request from 'supertest'
import { app } from '../backend/src/server'

describe('Additional Request validation E2E', () => {
  it('should reject invalid reports payload', async () => {
    const res = await request(app)
      .post('/api/reports/daily/send-now')
      .send({ invalid: 'data' })
    expect(res.status).toBe(400)
  })

  it('should reject invalid webhook id param', async () => {
    const res = await request(app)
      .post('/api/webhooks/not-a-uuid/test')
      .send({})
    expect(res.status).toBe(400)
  })
})
