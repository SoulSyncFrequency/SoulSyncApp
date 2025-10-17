import request from 'supertest'
import app from '../src/app'

describe('Auth E2E', () => {
  it('register -> login -> me', async () => {
    const email = `user${Date.now()}@test.com`
    const password = 'pass1234'

    const reg = await request(app).post('/auth/register').send({ email, password })
    expect(reg.status).toBe(200)

    const login = await request(app).post('/auth/login').send({ email, password })
    expect(login.status).toBe(200)
    const token = login.body.accessToken
    expect(token).toBeDefined()

    const me = await request(app).get('/me').set('Authorization', `Bearer ${token}`)
    expect(me.status).toBe(200)
  })
})
