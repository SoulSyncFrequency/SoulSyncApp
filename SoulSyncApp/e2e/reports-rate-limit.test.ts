import request from 'supertest'
import { app } from '../backend/src/server'

describe('Reports rate limiting', () => {
  it('should return 429 on 4th quick request', async () => {
    const agent = request(app)
    const doPost = () => agent.post('/api/reports/daily/send-now').send({})
    const r1 = await doPost()
    const r2 = await doPost()
    const r3 = await doPost()
    const r4 = await doPost()
    // first three may be 200/401/etc., but 4th should be 429 with our limiter (3/min)
    expect(r4.status).toBe(429)
  })
})
