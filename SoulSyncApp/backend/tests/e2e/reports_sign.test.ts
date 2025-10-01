import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../../src/app'

describe('Reports signing', ()=>{
  it('rejects bad key', async ()=>{
    const res = await request(app).get('/api/admin/reports/sign?key=evil.txt')
    expect([400,401,429]).toContain(res.status)
  })
})
