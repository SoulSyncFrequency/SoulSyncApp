import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../../src/app'

describe('E2E routes', ()=>{
  it('POST /api/f0score -> 200', async ()=>{
    const res = await request(app)
      .post('/api/f0score')
      .send({ Sym:.8, Pol:.7, Bph:.9, Emo:.6, Coh:.7, Frac:.5, Conn:.6, Chak:.7, Info:.8, Safe:.9, disease_type:'psychological' })
      .expect(200)
    expect(res.body).toHaveProperty('F0_score')
  })

  it('POST /api/admin/suggestions/apply -> 200', async ()=>{
    const res = await request(app)
      .post('/api/admin/suggestions/apply')
      .send({
        collection:'therapies', id:'T1',
        document:{ title:'A', notes:{ lang:'en' }},
        suggestions:[{ path:'notes.lang', value:'hr', score:0.9 }],
        autoTune:true
      })
      .expect(200)
    expect(res.body.ok).toBe(true)
    expect(res.body.result?.notes?.lang).toBe('hr')
  })
})
