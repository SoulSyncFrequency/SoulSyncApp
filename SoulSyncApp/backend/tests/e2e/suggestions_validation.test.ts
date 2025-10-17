import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../../src/app'

describe('Suggestions validation', ()=>{
  it('400 on invalid payload', async()=>{
    const res = await request(app).post('/api/admin/suggestions/apply').send({ bad: true })
    expect(res.status).toBe(400)
  })
})
