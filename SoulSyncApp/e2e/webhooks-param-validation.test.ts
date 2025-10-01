import request from 'supertest'
import { app } from '../backend/src/server'

describe('Webhook test id param validation', () => {
  it('rejects non-uuid id param', async () => {
    const res = await request(app)
      .post('/api/webhooks/not-a-uuid/test')
      .send({})
    expect(res.status).toBe(400)
  })
})
