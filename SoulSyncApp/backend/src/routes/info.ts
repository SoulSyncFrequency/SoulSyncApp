import { Router } from 'express'
import os from 'os'
const router = Router()

router.get('/_info', async (_req, res)=>{
  const envs = ['NODE_ENV','JSON_LIMIT','F0_SAFE_THRESHOLD','F0_SYNERGY_SCALE','F0_CACHE_MAX','F0_CACHE_TTL_MS','F0_REDIS_CACHE','VERIFY_SUGGESTIONS','ALLOWED_ORIGINS']
  const env = Object.fromEntries(envs.map(k=> [k, process.env[k]]))
  let redis = { ok:false }
  try{ const Redis = require('ioredis'); if(process.env.REDIS_URL){ const r = new Redis(process.env.REDIS_URL); await r.ping(); redis = { ok:true }; r.disconnect() } }catch{}
  const aiKey = !!process.env.OPENAI_API_KEY
  const s3 = !!process.env.DS_S3_BUCKET
  let prisma = { ok:false }
  try{ const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); await p.$queryRaw`SELECT 1`; prisma = { ok:true }; await p.$disconnect() }catch{}
  const mem = process.memoryUsage && process.memoryUsage();
  const build = { version: process.env.BUILD_VERSION || null, time: process.env.BUILD_TIME || null }
  res.json({ ok:true, ts: Date.now(), pid: process.pid, host: os.hostname(), env, redis, aiKey, s3, prisma, memory: { rss: mem?.rss, heapUsed: mem?.heapUsed }, build })
})

export default router