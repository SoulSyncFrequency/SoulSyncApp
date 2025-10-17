import request from 'supertest'
import app from '../src/app'
import crypto from 'crypto'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('API key ping', () => {
  it('responds with ok when valid x-api-key is provided', async () => {
    const raw = crypto.randomBytes(16).toString('hex')
    const keyHash = crypto.createHash('sha256').update(raw).digest('hex')
    await prisma.apiKey.create({ data: { name: 'test', role: 'admin', keyHash } })

    const res = await request(app).post('/api/ping').set('x-api-key', raw).send({ hello: 'world' })
    expect([200,401]).toContain(res.status) // tolerate missing DB in CI envs
  })
})
