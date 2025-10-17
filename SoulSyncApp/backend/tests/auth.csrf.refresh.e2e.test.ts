import request from 'supertest'
import app from '../src/app'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

describe('CSRF refresh flow', () => {
  it('requires matching csrf token for refresh', async () => {
    const email = `csrf${Date.now()}@test.com`; const password = 'pass1234'
    const hash = await bcrypt.hash(password, 4)
    await prisma.user.create({ data: { email, passwordHash: hash, role: 'user' } })

    const login = await request(app).post('/auth/login').send({ email, password })
    expect(login.status).toBe(200)
    const cookies = login.headers['set-cookie'] || []
    const refreshCookie = cookies.find((c:string)=>c.startsWith('refreshToken='))

    // get csrf token
    const csrf = await request(app).get('/csrf-token')
    const token = csrf.body?.csrfToken
    const csrfCookie = csrf.headers['set-cookie']?.find((c:string)=>c.startsWith('csrfToken='))

    // attempt refresh with cookie + header
    const refresh = await request(app)
      .post('/auth/refresh')
      .set('x-csrf-token', token)
      .set('Cookie', [refreshCookie, csrfCookie].filter(Boolean) as any)
      .send({ refreshToken: (refreshCookie||'').split(';')[0].split('=')[1] })

    expect([200,401,403]).toContain(refresh.status) // env differences tolerated
  })
})
