const request = require('supertest')
const base = process.env.BASE_URL||'http://localhost:8080'

;(async()=>{
  try{
    let r = await request(base).get('/healthz')
    console.log('healthz', r.status)
    r = await request(base).post('/auth/mfa/totp/setup').send()
    console.log('mfa totp setup', r.status)
    r = await request(base).post('/rag/query').send({ q:'terms' })
    console.log('rag query', r.status)
  }catch(e){ console.error('e2e-smoke', e?.message||e) }
})()
