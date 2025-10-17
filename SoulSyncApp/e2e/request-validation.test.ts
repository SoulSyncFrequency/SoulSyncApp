import request from 'supertest'
import { app } from '../backend/src/server'

describe('Request validation E2E', () => {
  it('should reject invalid login body', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ bad: 'data' })
    expect(res.status).toBe(400)
  })

  it('should accept valid login body shape', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: '123456' })
    // depending on auth implementation, status may be 200 or 401 (invalid creds) but not 400 schema error
    expect([200,401]).toContain(res.status)
  })
})
