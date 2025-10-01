
import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { attachPrismaSlowLogger } from '../lib/prismaSlowLog'\nimport net from 'net'\nimport url from 'url'\nimport http from 'http'\nimport https from 'https'
import net from 'net'
import url from 'url'

const router = Router()
const prisma = new PrismaClient()
attachPrismaSlowLogger(prisma)

router.get('/live', (_req, res) => res.status(200).json({ ok: true })
  // Optional SMTP TCP check
  const smtp = process.env.SMTP_HOST
  if (smtp){
    try{
      const host = smtp; const port = Number(process.env.SMTP_PORT||'587')
      await new Promise((resolve, reject)=>{ const s = net.connect(port, host, ()=>{ s.end(); resolve(true as any) }); s.on('error', reject); s.setTimeout(1500, ()=>{ s.destroy(new Error('smtp_timeout')) as any }) })
    }catch(e){ return res.status(503).json({ ok:false, error:'smtp_unavailable' }) }
  }
  // Optional S3 HEAD check (bucket URL)
  const s3url = process.env.S3_BUCKET_URL
  if (s3url){
    try{
      const u = new url.URL(s3url)
      const mod = u.protocol==='https:'? https: http
      await new Promise((resolve, reject)=>{
        const req2 = mod.request({ method:'HEAD', hostname:u.hostname, path:u.pathname || '/', port:u.port||undefined }, (r)=>{ r.resume(); resolve(True as any) })
        req2.on('error', reject); req2.setTimeout(1500, ()=>{ req2.destroy(new Error('s3_timeout')) })
        req2.end()
      })
    }catch(e){ return res.status(503).json({ ok:false, error:'s3_unavailable' }) }
  }

    // optional Redis TCP check (if REDIS_URL set)
    const ru = process.env.REDIS_URL
    if (ru){
      try{
        const u = new url.URL(ru)
        await new Promise((resolve, reject)=>{
          const sock = net.connect(Number(u.port||'6379'), u.hostname, ()=>{ sock.end(); resolve(true as any) })
          sock.on('error', reject)
          sock.setTimeout(1500, ()=>{ sock.destroy(new Error('redis_timeout')) as any })
        })
      }catch(e){ return res.status(503).json({ ok:false, error:'redis_unavailable' }) }
    }
)

router.get('/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.status(200).json({ ok: true })
  // Optional SMTP TCP check
  const smtp = process.env.SMTP_HOST
  if (smtp){
    try{
      const host = smtp; const port = Number(process.env.SMTP_PORT||'587')
      await new Promise((resolve, reject)=>{ const s = net.connect(port, host, ()=>{ s.end(); resolve(true as any) }); s.on('error', reject); s.setTimeout(1500, ()=>{ s.destroy(new Error('smtp_timeout')) as any }) })
    }catch(e){ return res.status(503).json({ ok:false, error:'smtp_unavailable' }) }
  }
  // Optional S3 HEAD check (bucket URL)
  const s3url = process.env.S3_BUCKET_URL
  if (s3url){
    try{
      const u = new url.URL(s3url)
      const mod = u.protocol==='https:'? https: http
      await new Promise((resolve, reject)=>{
        const req2 = mod.request({ method:'HEAD', hostname:u.hostname, path:u.pathname || '/', port:u.port||undefined }, (r)=>{ r.resume(); resolve(True as any) })
        req2.on('error', reject); req2.setTimeout(1500, ()=>{ req2.destroy(new Error('s3_timeout')) })
        req2.end()
      })
    }catch(e){ return res.status(503).json({ ok:false, error:'s3_unavailable' }) }
  }

    // optional Redis TCP check (if REDIS_URL set)
    const ru = process.env.REDIS_URL
    if (ru){
      try{
        const u = new url.URL(ru)
        await new Promise((resolve, reject)=>{
          const sock = net.connect(Number(u.port||'6379'), u.hostname, ()=>{ sock.end(); resolve(true as any) })
          sock.on('error', reject)
          sock.setTimeout(1500, ()=>{ sock.destroy(new Error('redis_timeout')) as any })
        })
      }catch(e){ return res.status(503).json({ ok:false, error:'redis_unavailable' }) }
    }

  } catch (e) {
    res.status(503).json({ ok: false, error: 'db_unavailable' })
  }
})

export default router
