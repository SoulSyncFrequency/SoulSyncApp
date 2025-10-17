const request=require('supertest'); const base=process.env.BASE_URL||'http://localhost:8080'
;(async()=>{ 
  try{ const r=await request(base).get('/redis/health'); console.log('/redis/health', r.status) }catch(e){ console.log('redis smoke:', e?.message||e) } 
})()
