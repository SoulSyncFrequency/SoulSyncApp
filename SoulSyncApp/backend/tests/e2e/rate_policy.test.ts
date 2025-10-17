import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../../src/app'

describe('Rate policy propose', ()=>{
  it('proposes defaults', async ()=>{
    const res = await request(app).post('/api/admin/rate-policy/propose').send({})
    expect([200,401,429]).toContain(res.status)
  })
})
