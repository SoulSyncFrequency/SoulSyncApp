
import { Router } from 'express'
import { notifyAll } from '../services/notifier'
import { PrismaClient } from '@prisma/client'
import { attachPrismaSlowLogger } from '../lib/prismaSlowLog'
import fs from 'fs'
import path from 'path'
import net from 'net'
import url from 'url'

const router = Router()
const prisma = new PrismaClient()
attachPrismaSlowLogger(prisma)

router.get('/self-test', async (_req, res) => {
  const checks:any = { env: {}, db: null, redis: null, fs: null }
  // ENV
  const required = ['JWT_SECRET','CORS_ALLOWED_ORIGINS']
  checks.env.missing = required.filter(k => !process.env[k] || String(process.env[k]).trim()==='')
  // DB
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.db = true
  } catch(e) {
    checks.db = false
  }
  // Redis (optional)
  const ru = process.env.REDIS_URL
  if (ru){
    try{
      const u = new url.URL(ru)
      await new Promise((resolve, reject)=>{
        const sock = net.connect(Number(u.port||'6379'), u.hostname, ()=>{ sock.end(); resolve(true as any) })
        sock.on('error', reject); sock.setTimeout(1500, ()=>{ sock.destroy(new Error('redis_timeout')) as any })
      })
      checks.redis = true
    }catch{ checks.redis = false }
  }
  // FS write
  try {
    const dir = path.join(process.cwd(), 'tmp'); fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir,'selftest.txt'), String(Date.now()))
    checks.fs = true
  } catch { checks.fs = false }

  const ok = checks.env.missing.length===0 && checks.db===true && (checks.redis!==false) && checks.fs===true
  res.status(ok?200:503).json({ ok, checks })
})

export default router
