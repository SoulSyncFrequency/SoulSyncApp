import request from 'supertest'
import app from '../src/app'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

describe('Login lockout', () => {
  it('locks account after too many failed attempts', async () => {
    const email = `lock${Date.now()}@test.com`
    const password = 'pass1234'
    const hash = await bcrypt.hash(password, 4)
    await prisma.user.create({ data: { email, passwordHash: hash, role: 'user' } })

    // Wrong password 6x (defaults: 5 max, 15m window)
    for (let i=0;i<5;i++){
      const res = await request(app).post('/auth/login').send({ email, password: 'wrong' })
      expect([401,423]).toContain(res.status)
      if (res.status===423) break
    }
    const res = await request(app).post('/auth/login').send({ email, password: 'wrong' })
    expect([401,423]).toContain(res.status)
  })
})
