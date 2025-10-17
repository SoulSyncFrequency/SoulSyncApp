import { Router } from 'express'
import { clampPageLimit } from '../lib/pagination'
const router = Router()
const { kvGet, kvSet, kvGetStale } = require('../utils/kvCache')

router.get('/_policy', async (_req,res)=>{
  try{
    const key = 'policy:v1'
    const cached = await kvGet(key)
    if(cached){ res.setHeader('x-cache','HIT'); return res.json(cached) }
    const client = require('prom-client')
    const reg = client.register
    const mets = reg.getMetricsAsJSON()
    const hist = mets.find((m:any)=> m.name==='http_server_duration_seconds' && m.type==='histogram')
    let total=0, s2=0, s4=0, s5=0
    let rl=0, slow=0
    try{
    const key = 'policy:v1'
    const cached = await kvGet(key)
    if(cached){ res.setHeader('x-cache','HIT'); return res.json(cached) } const rlMet = mets.find((m:any)=> m.name==='rate_limited_requests_total'); rl = rlMet?.values?.[0]?.value || 0 }catch{}
    try{
    const key = 'policy:v1'
    const cached = await kvGet(key)
    if(cached){ res.setHeader('x-cache','HIT'); return res.json(cached) } const slowMet = mets.find((m:any)=> m.name==='slow_requests_total'); slow = slowMet?.values?.[0]?.value || 0 }catch{}
    if(hist && hist.values){
      for(const s of hist.values){
        const c = s.count||0; total += c
        const st = Number(s.labels?.status||0)
        if(st>=200 && st<300) s2 += c
        else if(st>=400 && st<500) s4 += c
        else if(st>=500) s5 += c
      }
    }
    const pct = (n:any,d:any)=> d>0 ? +(100*n/d).toFixed(2) : 0
    
    // compute p95 & top-3 slow by route using buckets (conservative)
    function qFrom(buckets:any, count:number, q:number){
      const keys = Object.keys(buckets).filter((k:string)=> k!=='+Inf').map(parseFloat).sort((a:number,b:number)=> a-b)
      let cum=0; const tgt = Math.ceil(count*q)
      for(const k of keys){ cum += (buckets[String(k)]||0); if(cum>=tgt) return k }
      return Infinity
    }
    const perRoute:any = {}
    if(hist && hist.values){
      for(const s of hist.values){
        const labels = s.labels||{}; const key = labels.method+' '+labels.route
        const buckets = s.buckets||{}; const count = s.count||0
        if(count<=0) continue
        const p95v = qFrom(buckets,count,0.95)
        const r = perRoute[key] ||= { route: key, count:0, p95:0 }
        r.count += count; r.p95 = Math.max(r.p95, p95v)
      }
    }
    const slowArr = Object.values(perRoute).sort((a:any,b:any)=> (b.p95||0)-(a.p95||0)).slice(0,3)
    const p95 = slowArr[0]?.p95 || 0
    function budgetsFromEnv(){
      try{
        if(process.env.SLO_P95_BUDGETS){ return JSON.parse(process.env.SLO_P95_BUDGETS) }
      }catch{}
      try{
        const fs = require('fs'); const path = require('path')
        const fp = path.join(process.cwd(), 'config', 'slo_budgets.json')
        if(fs.existsSync(fp)){ return JSON.parse(fs.readFileSync(fp,'utf-8')) }
      }catch{}
      return {}
    }
    const budgets = budgetsFromEnv()
    const failing:any[] = []
    for(const r of slowArr){
      const b = budgets[r.route]; if(b && r.p95 && r.p95 > Number(b)){ failing.push({ route: r.route, p95: r.p95, budget: Number(b) }) }
    }
    const resObj = { ok:true, total, pct2xx: pct(s2,total), pct4xx: pct(s4,total), pct5xx: pct(s5,total), rateLimited: rl, slowTotal: slow, p95, topSlow: slowArr, budgets: { count: Object.keys(budgets).length, failing } }
    await kvSet(key, resObj, 10, { staleSec: 20 })
    res.setHeader('x-cache','MISS')
    return res.json(resObj)
  }catch(e:any){
    return res.status(500).json({ ok:false, error: e?.message })
  }
})

export default router
