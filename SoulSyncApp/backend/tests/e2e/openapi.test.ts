import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../../src/app'

describe('OpenAPI route', ()=>{
  it('GET /api/openapi.json returns valid-ish doc', async ()=>{
    const res = await request(app).get('/api/openapi.json')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('openapi')
    expect(res.body).toHaveProperty('paths')
  })
})
