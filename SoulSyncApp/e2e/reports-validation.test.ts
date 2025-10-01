import request from 'supertest'
import { app } from '../backend/src/server'

describe('Reports daily send-now validation', () => {
  it('rejects invalid payload', async () => {
    const res = await request(app)
      .post('/api/reports/daily/send-now')
      .send({ date: 123, force: 'yes' })
    expect(res.status).toBe(400)
  })
})
