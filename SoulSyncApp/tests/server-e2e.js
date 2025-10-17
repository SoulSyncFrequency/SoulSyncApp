const request=require('supertest'); const base=process.env.BASE_URL||'http://localhost:8080'
;(async()=>{
  try{
    let r=await request(base).get('/healthz').set('X-Request-Id','e2e-req-1'); console.log('healthz', r.status, r.headers['x-request-id'])
    r=await request(base).get('/readyz'); console.log('readyz', r.status, r.body?.redis, r.body?.mfa)
  }catch(e){ console.error('server-e2e', e?.message||e) }
})()


// Extra: security headers check
const http = require('http')
http.get({ host:'localhost', port:3000, path:'/healthz' }, res=>{
  const h = res.headers
  const expect = ['strict-transport-security','cross-origin-opener-policy','cross-origin-embedder-policy']
  for(const e of expect){ if(!h[e]){ console.error('Missing header',e); process.exit(1) } }
  console.log('Security headers ok')
})
