import { Router } from 'express'
import { clampPageLimit } from '../lib/pagination'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { requireRole } from '../middleware/apiKeyAuth'

const router = Router()

router.get('/admin/diagnostics/bundle.tgz', requireRole('viewer'), async (_req, res)=>{
  try{
    const zlib = require('zlib'); const tar = require('tar-stream'); const client = require('prom-client')
    res.setHeader('content-type','application/gzip')
    res.setHeader('content-disposition','attachment; filename="diagnostics.tgz"')
    const pack = tar.pack(); const gzip = zlib.createGzip(); pack.pipe(gzip).pipe(res)

    // info.json (reuse /_info logic via dynamic import)
    try{
      const info = { pid: process.pid, host: os.hostname(), ts: Date.now(), env: Object.keys(process.env).filter(k=>/^NODE_ENV$|^PROM|^F0_|^DS_|^ADMIN_|^REDIS_|^OPENAI_|^FORCE_HTTPS$|^MAINTENANCE_MODE$/.test(k)).reduce((a:any,k)=> (a[k]=true, a), {}) }
      const buf = Buffer.from(JSON.stringify(info, null, 2))
      pack.entry({ name:'info.json', size: buf.length }, buf)
    }catch{}

    // metrics.txt
    try{
      const metrics = await client.register.metrics()
      const mBuf = Buffer.from(metrics)
      pack.entry({ name:'metrics.txt', size: mBuf.length }, mBuf)
    }catch{}

    // _stats.json (same calculation as /_stats by reading registry)
    try{
      const mets = client.register.getMetricsAsJSON()
      const hist = mets.find((m:any)=> m.name==='http_server_duration_seconds' && m.type==='histogram')
      const routes:any[] = []
      if(hist && hist.values){
        for(const s of hist.values||[]){
          const labels = s.labels||{}; const buckets = s.buckets||{}; const count = s.count||0
          if(count<=0) continue
          const keys = Object.keys(buckets).filter((k:string)=> k!=='+Inf').map(parseFloat).sort((a:number,b:number)=> a-b)
          const q=(p:number)=>{ let cum=0; const tgt=Math.ceil(count*p); for(const k of keys){ cum+=buckets[String(k)]||0; if(cum>=tgt) return k } return Infinity }
          routes.push({ method: labels.method, route: labels.route, status: labels.status, count, p50:q(0.5), p90:q(0.9), p95:q(0.95), p99:q(0.99) })
        }
      }
      const sBuf = Buffer.from(JSON.stringify({ routes }, null, 2))
      pack.entry({ name:'_stats.json', size: sBuf.length }, sBuf)
    }catch{}

    // recent stats files list
    try{
      const base = path.join(process.cwd(), 'stats')
      if(fs.existsSync(base)){
        const files = fs.readdirSync(base).filter(f=>/^stats_/.test(f)).sort().slice(-20)
        const lBuf = Buffer.from(JSON.stringify({ files }, null, 2))
        pack.entry({ name:'stats_files.json', size: lBuf.length }, lBuf)
      }
    }catch{}

    pack.finalize()
  }catch(e:any){
    res.status(500).json({ ok:false, error: e?.message })
  }
})

export default router


router.post('/admin/diagnostics/upload', requireRole('viewer'), async (_req, res)=>{
  try{
    const zlib = require('zlib'); const tar = require('tar-stream'); const client = require('prom-client')
    const fs = require('fs'); const path = require('path')
    const bucket = process.env.STATS_S3_BUCKET || process.env.DS_S3_BUCKET
    if(!bucket) return res.status(400).json({ ok:false, error:'no_bucket' })
    let AWS:any=null; try{ AWS = require('aws-sdk') }catch{}
    if(!AWS || !AWS.S3) return res.status(501).json({ ok:false, error:'aws_sdk_missing' })

    const tmpDir = path.join(process.cwd(),'tmp'); fs.mkdirSync(tmpDir,{recursive:true})
    const out = path.join(tmpDir, 'diagnostics_'+Date.now()+'.tgz')

    await new Promise<void>((resolve,reject)=>{
      const pack = tar.pack(); const gzip = zlib.createGzip(); const ws = fs.createWriteStream(out)
      pack.pipe(gzip).pipe(ws)
      // info.json
      try{ const info = { ts: Date.now(), env: Object.keys(process.env).filter(k=>/^NODE_ENV$|^PROM|^F0_|^DS_|^ADMIN_|^REDIS_|^OPENAI_|^FORCE_HTTPS$|^MAINTENANCE_MODE$|^SAFE_MODE$/.test(k)).reduce((a:any,k)=> (a[k]=true, a), {}) }
        const buf = Buffer.from(JSON.stringify(info,null,2)); pack.entry({name:'info.json', size: buf.length}, buf) }catch{}
      // metrics.txt
      try{ client.register.metrics().then((m:string)=>{ const b=Buffer.from(m); pack.entry({name:'metrics.txt', size:b.length}, b); pack.finalize() }) }catch(e){ try{ pack.finalize() }catch{} }
      ws.on('finish', ()=> resolve()); ws.on('error', reject)
    })

    const s3 = new AWS.S3(); const Key = 'diagnostics/'+require('path').basename(out)
    const Body = require('fs').readFileSync(out)
    await s3.putObject({ Bucket: bucket, Key, Body, ContentType:'application/gzip' }).promise()
    const cdn = process.env.DS_S3_CDN || ''
    const s3Url = cdn ? (cdn.replace(/\/$/,'') + '/' + Key) : (`https://${bucket}.s3.amazonaws.com/`+Key)
    try{ fs.unlinkSync(out) }catch{}
    return res.json({ ok:true, s3Url, key: Key })
  }catch(e:any){
    return res.status(500).json({ ok:false, error: e?.message })
  }
})
