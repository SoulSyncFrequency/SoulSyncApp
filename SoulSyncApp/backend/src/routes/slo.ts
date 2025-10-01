import { Router } from 'express'
const router = Router()
const { kvGet, kvSet } = require('../utils/kvCache')

router.get('/_slo', async (_req,res)=>{
  try{
    const key = 'slo:v1'
    const cached = await kvGet(key); if(cached){ res.setHeader('x-cache','HIT'); return res.json(cached) }
    const client = require('prom-client')
    const reg = client.register
    const mets = reg.getMetricsAsJSON()
    const hist = mets.find((m:any)=> m.name==='http_server_duration_seconds' && m.type==='histogram')
    function qFrom(buckets:any, count:number, q:number){
      const keys = Object.keys(buckets).filter((k:string)=> k!=='+Inf').map(parseFloat).sort((a:number,b:number)=> a-b)
      let cum=0; const tgt = Math.ceil(count*q)
      for(const k of keys){ cum += (buckets[String(k)]||0); if(cum>=tgt) return k }
      return Infinity
    }
    const per:any = {}
    if(hist && hist.values){
      for(const s of hist.values){
        const method = s.labels?.method||''; const route = s.labels?.route||''
        const keyR = method+' '+route
        const count = s.count||0; const buckets = s.buckets||{}
        if(count<=0) continue
        const p95 = qFrom(buckets, count, 0.95)
        const item = per[keyR] ||= { route: keyR, count: 0, p95: 0 }
        item.count += count; item.p95 = Math.max(item.p95, p95)
      }
    }
    // budgets
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
    for(const r of Object.values(per) as any[]){
      const b = budgets[r.route]; if(b && r.p95 && r.p95 > Number(b)){ failing.push({ route: r.route, p95: r.p95, budget: Number(b) }) }
    }
    const result = { ok:true, routes: Object.values(per), budgets: { map: budgets, failing } }
    await kvSet(key, result, 10, { staleSec: 20 })
    res.setHeader('x-cache','MISS')
    res.json(result)
  }catch(e:any){
    res.status(500).json({ ok:false, error: e?.message })
  }
})

export default router
