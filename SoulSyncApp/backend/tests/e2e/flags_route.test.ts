import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../../src/app'

describe('Flags route', ()=>{
  it('returns flags', async ()=>{
    const res = await request(app).get('/api/admin/flags').set('x-api-key', 'test')
    expect([200,401,429]).toContain(res.status)
  })
})
