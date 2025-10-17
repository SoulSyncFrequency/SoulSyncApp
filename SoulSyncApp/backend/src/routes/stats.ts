import { Router } from 'express'
import { clampPageLimit } from '../lib/pagination'
const router = Router()

function quantFromBuckets(buckets:any, count:number, q:number){
  const keys = Object.keys(buckets).filter((k:string)=> k!=='+Inf').map(parseFloat).sort((a:number,b:number)=> a-b)
  let cum=0; const target = Math.ceil(count*q)
  for(const k of keys){ cum += (buckets[String(k)]||0); if(cum>=target) return k }
  return Infinity
}

router.get('/_stats', (req, res)=>{
  try{
    const client = require('prom-client')
    if(!client || process.env.PROM_METRICS_HTTP!=='1'){
      return res.status(404).json({ ok:false, error:'metrics_disabled' })
    }
    const registry = client.register
    const raw = registry.metrics()
    const mets = registry.getMetricsAsJSON()
    const etag = require('crypto').createHash('sha1').update(String(await raw)).digest('hex')
    const inm = String(req.headers['if-none-match']||'')
    res.setHeader('ETag', etag)
    res.setHeader('Cache-Control','public, s-maxage=15, stale-while-revalidate=30')
    if(inm && inm===etag){ return res.status(304).end() }
    const hist = mets.find((m:any)=> m.name==='http_server_duration_seconds' && m.type==='histogram')
    if(!hist || !hist.buckets) return res.json({ ok:true, routes: [] })
    // Approximate p95 via cumulative buckets per label set
    const routes:any[] = []
    for(const s of hist.values||[]){
      const labels = s.labels||{}
      const buckets = s.buckets||{}
      // total count
      const count = s.count || 0
      if(count<=0) continue
      const p50 = quantFromBuckets(buckets, count, 0.50)
      const p90 = quantFromBuckets(buckets, count, 0.90)
      const p95 = quantFromBuckets(buckets, count, 0.95)
      const p99 = quantFromBuckets(buckets, count, 0.99)
      routes.push({ method: labels.method, route: labels.route, status: labels.status, count, p50, p90, p95, p99 })
    }
    
    // aggregate by method+route ignoring status
    const groups:any = {}
    for(const r of routes){
      const key = r.method+' '+r.route
      const g = groups[key] ||= { method: r.method, route: r.route, count:0, p95:0 }
      // conservative: take max for each quantile across statuses
      g.p50 = Math.max(Number(g.p50||0), Number(r.p50||0) || 0)
      g.p90 = Math.max(Number(g.p90||0), Number(r.p90||0) || 0)
      g.p95 = Math.max(Number(g.p95||0), Number(r.p95||0) || 0)
      g.p99 = Math.max(Number(g.p99||0), Number(r.p99||0) || 0)
      g.count += r.count||0
    }
    const arr = Object.values(groups) as any[]
    const top = Math.max(1, Math.min( Number(req.query.top||10), 100 ))
    arr.sort((a,b)=> (b.p95||0) - (a.p95||0))
    const data = arr.slice(0, top)
    const wantsCsv = (req.query.format==='csv') || /text\/csv/.test(String(req.headers['accept']||''))
    if(wantsCsv){
      const lines = ['method,route,count,p50,p90,p95,p99']
      for(const r of data){ lines.push([r.method, '"'+(r.route||'')+'"', r.count, r.p50, r.p90, r.p95, r.p99].join(',')) }
      res.setHeader('content-type','text/csv'); return res.send(lines.join('\n'))
    }
    res.json({ ok:true, routes: data })
    
  }catch(e:any){
    res.status(500).json({ ok:false, error: e?.message })
  }
})

export default router


import fs from 'fs'
import path from 'path'
import { requireRole } from '../middleware/apiKeyAuth'

router.post('/admin/stats/export', requireRole('viewer'), (req, res)=>{
  const fmt = (req.query.format as string) || 'csv'
  const idem = (req.headers['idempotency-key'] as string) || ''
  const crypto = require('crypto'); const fs = require('fs'); const path = require('path')
  if(idem){
    const dir = path.join(process.cwd(),'tmp','idem_stats'); fs.mkdirSync(dir,{recursive:true})
    const h = crypto.createHash('sha1').update(idem).digest('hex')
    const fjson = path.join(dir, h+'.json'); const flock = path.join(dir, h+'.lock')
    if(fs.existsSync(fjson)){
      try{ const j = JSON.parse(fs.readFileSync(fjson,'utf-8')); return res.json(j) }catch{}
    }
    if(fs.existsSync(flock) && (Date.now()-fs.statSync(flock).mtimeMs<5*60*1000)){
      return res.status(409).json({ ok:false, code:'in_progress' })
    }
    try{ fs.writeFileSync(flock, String(Date.now())) }catch{}
    res.on('finish', ()=>{ try{ fs.unlinkSync(flock) }catch{} })
  }
  const base = path.join(process.cwd(), 'stats')
  fs.mkdirSync(base, { recursive: true })
  const ts = new Date().toISOString().replace(/[:]/g,'').slice(0,15)
  let filename = path.join(base, `stats_${ts}.${fmt==='jsonl'?'jsonl':'csv'}`)
  const client = require('prom-client')
  if(!client || process.env.PROM_METRICS_HTTP!=='1'){
    return res.status(404).json({ ok:false, error:'metrics_disabled' })
  }
  // Reuse current calculation via self-call to handler logic
  try{
    const registry = client.register
    const raw = registry.metrics()
    const mets = registry.getMetricsAsJSON()
    const etag = require('crypto').createHash('sha1').update(String(await raw)).digest('hex')
    const inm = String(req.headers['if-none-match']||'')
    res.setHeader('ETag', etag)
    res.setHeader('Cache-Control','public, s-maxage=15, stale-while-revalidate=30')
    if(inm && inm===etag){ return res.status(304).end() }
    const hist = mets.find((m:any)=> m.name==='http_server_duration_seconds' && m.type==='histogram')
    const routes:any[] = []
    if(hist && hist.values){
      for(const s of hist.values||[]){
        const labels = s.labels||{}
        const buckets = s.buckets||{}
        const count = s.count || 0
        if(count<=0) continue
        const keys = Object.keys(buckets).filter((k:string)=> k!=='+Inf').map(parseFloat).sort((a:number,b:number)=> a-b)
        const q = (p:number)=>{
          const target = Math.ceil(count*p)
          let cum=0; for(const k of keys){ cum += buckets[String(k)]||0; if(cum>=target) return k }
          return Infinity
        }
        const row = { ts: Date.now(), method: labels.method, route: labels.route, status: labels.status, count, p50: q(0.5), p90: q(0.9), p95: q(0.95), p99: q(0.99) }
        routes.push(row)
      }
    }
    if(fmt==='jsonl'){
      const out = routes.map(r=> JSON.stringify(r)).join('\n') + '\n'
      fs.writeFileSync(filename, out)
    // rotate: keep last 20 files
    try{ const files = fs.readdirSync(base).filter(f=>/^stats_/.test(f)).map(f=>({f, t:fs.statSync(path.join(base,f)).mtimeMs})).sort((a,b)=>b.t-a.t); for(const x of files.slice(20)){ fs.unlinkSync(path.join(base, x.f)) } }catch{}
    }else{
      const lines = ['ts,method,route,status,count,p50,p90,p95,p99']
      for(const r of routes){ lines.push([r.ts, r.method, '"'+(r.route||'')+'"', r.status, r.count, r.p50, r.p90, r.p95, r.p99].join(',')) }
      fs.writeFileSync(filename, lines.join('\n'))
    // rotate: keep last 20 files
    try{ const files = fs.readdirSync(base).filter(f=>/^stats_/.test(f)).map(f=>({f, t:fs.statSync(path.join(base,f)).mtimeMs})).sort((a,b)=>b.t-a.t); for(const x of files.slice(20)){ fs.unlinkSync(path.join(base, x.f)) } }catch{}
    }
    let s3Url = null
    try{
      const bucket = process.env.STATS_S3_BUCKET
      if(bucket){
        let AWS
        try{ AWS = require('aws-sdk') }catch{ AWS = null }
        if(AWS && AWS.S3){
          const s3 = new AWS.S3()
          const Key = 'stats/' + require('path').basename(filename)
          const Body = require('fs').readFileSync(filename)
          await s3.putObject({ Bucket: bucket, Key, Body, ContentType: (fmt==='jsonl'?'application/json':'text/csv') }).promise()
          const cdn = process.env.DS_S3_CDN || ''
          s3Url = cdn ? (cdn.replace(/\/$/,'') + '/' + Key) : (`https://${bucket}.s3.amazonaws.com/`+Key)
        }
      }
    }catch{}
    if(s3Url && process.env.AUTO_DELETE_STATS_AFTER_S3==='1'){ try{ require('fs').unlinkSync(filename) }catch{} }
    const payload = { ok:true, file: path.relative(process.cwd(), filename), s3Url }
    try{ if(idem){ const dir = path.join(process.cwd(),'tmp','idem_stats'); const h = crypto.createHash('sha1').update(idem).digest('hex'); const fjson = path.join(dir, h+'.json'); fs.writeFileSync(fjson, JSON.stringify(payload)) } }catch{}
    return res.json(payload)
  }catch(e:any){
    return res.status(500).json({ ok:false, error: e?.message })
  }
})


router.get('/_stats/history', (req, res)=>{
  const fs = require('fs'); const path = require('path')
  const base = path.join(process.cwd(), 'stats')
  const limit = Math.max(1, Math.min(Number(req.query.limit||30), 90))
  const byRoute:any = {}
  try{
    if(!fs.existsSync(base)) return res.json({ ok:true, series: {} })
    const files = fs.readdirSync(base).filter((f:string)=> /^stats_/.test(f)).sort().slice(-limit)
    for(const f of files){
      const fp = path.join(base, f)
      if(/\.jsonl$/i.test(f)){
        const lines = fs.readFileSync(fp,'utf-8').trim().split(/\n+/)
        for(const ln of lines){
          try{ const j = JSON.parse(ln); const key = j.method+' '+j.route; const p95 = Number(j.p95||0); if(!byRoute[key]) byRoute[key]=[]; byRoute[key].push({ t:j.ts||Date.now(), p95 }) }catch{}
        }
      }else if(/\.csv$/i.test(f)){
        const rows = fs.readFileSync(fp,'utf-8').trim().split(/\n+/).slice(1)
        for(const r of rows){
          const parts = r.split(','); if(parts.length<7) continue
          const t = Number(parts[0]); const method = parts[1]; const route = parts[2].replace(/^"|"$/g,'')
          const p95 = Number(parts[6]); const key = method+' '+route
          if(!byRoute[key]) byRoute[key]=[]; byRoute[key].push({ t, p95 })
        }
      }
    }
  }catch{}
  res.json({ ok:true, series: byRoute })
})
