import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../../src/app'

describe('Admin protection', ()=>{
  it('rejects admin call without API key when keys configured', async ()=>{
    process.env.ADMIN_API_KEYS = 'testkey'
    const res = await request(app).post('/api/admin/datasheet/pdf').send({ rows:[{a:1}] })
    expect([401, 429]).toContain(res.status) // 429 possible if rate limiter triggers in CI
  })
})
