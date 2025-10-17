import request from 'supertest'
import express from 'express'
import auth from '../auth'
const app = express()
app.use(express.json())
app.use('/api/auth', auth)
test('register/login flow', async () => {
  const email = `user_${Date.now()}@x.com`
  const password = 'secret123'
  const reg = await request(app).post('/api/auth/register').send({ email, password })
  expect(reg.body.ok).toBe(true)
  const log = await request(app).post('/api/auth/login').send({ email, password })
  expect(log.body.ok).toBe(true)
  expect(typeof log.body.token).toBe('string')
})
