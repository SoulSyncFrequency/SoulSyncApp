const request=require('supertest'); const base=process.env.BASE_URL||'http://localhost:8080'
;(async()=>{ 
  try{ 
    const r=await request(base).post('/rag/query').send({q:'privacy'})
    console.log('/rag/query status', r.status, 'expected 401/403 in CI without auth')
  }catch(e){ console.log('rag smoke:', e?.message||e) } 
})()
