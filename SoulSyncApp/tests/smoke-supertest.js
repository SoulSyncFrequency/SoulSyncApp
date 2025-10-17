const request = require('supertest')
const base = process.env.BASE_URL || 'http://localhost:8080'
;(async()=>{
  try{
    const ok = await request(base).get('/healthz'); console.log('healthz:', ok.status)
    const r1 = await request(base).get('/readyz'); console.log('readyz:', r1.status)
    const r2 = await request(base).get('/livez'); console.log('livez:', r2.status)
  }catch(e){ console.error('Smoke error', e?.message||e) }
})()
