const request=require('supertest'); const base=process.env.BASE_URL||'http://localhost:8080'
;(async()=>{
  try{
    let r=await request(base).post('/auth/mfa/totp/setup').send()
    console.log('totp setup', r.status)
    r=await request(base).post('/auth/mfa/totp/verify').send({ code:'123456' })
    console.log('totp verify', r.status)
    r=await request(base).post('/auth/mfa/webauthn/register').send()
    console.log('webauthn register', r.status)
  }catch(e){ console.error('e2e-mfa', e?.message||e) }
})()
