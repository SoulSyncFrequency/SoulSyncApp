import { Router } from 'express'
let redis:any=null; try{ const { createClient } = require('redis'); if(process.env.REDIS_URL){ redis=createClient({ url: process.env.REDIS_URL }); redis.connect().catch(()=>{}) } }catch{}

const r = Router()
let mfaLibs = { otplib:false, simplewebauthn:false }
try{ require.resolve('otplib'); mfaLibs.otplib=true }catch{}
try{ require.resolve('@simplewebauthn/server'); mfaLibs.simplewebauthn=true }catch{}
r.get('/healthz', (_req,res)=> res.json({ ok:true }))
r.get('/livez', (_req,res)=> res.json({ ok:true }))
r.get('/readyz', async (_req,res)=>{
  let redisOk=true
  try{ if(redis){ const pong=await redis.ping(); redisOk=(pong==='PONG') } }catch{ redisOk=false }
  res.json({ ok:true, redis:redisOk, mfa:mfaLibs })
})
export default r
