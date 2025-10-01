
import { Router } from 'express'
import fs from 'fs'
import path from 'path'
function windowMsFrom(q:any){ const w = String((q?.window||'15m')).toLowerCase(); return w==='5m'? (5*60*1000): w==='60m'? (60*60*1000): (15*60*1000) }
const router = Router()
router.get('/ops/incident-report', (req, res) => {
  try{
    const win = windowMsFrom(req.query), now = Date.now()
    const access = path.join(process.cwd(),'logs','access.ndjson')
    const rows:any[] = []
    if (fs.existsSync(access)){
      const lines = fs.readFileSync(access,'utf-8').split(/\r?\n/).slice(-50000)
      for (const line of lines){
        if (!line) continue
        try{
          const j = JSON.parse(line)
          const ts = Number(j.t || j.time || 0) || (j.timestamp? Date.parse(j.timestamp): 0)
          if (ts && (now - ts) > win) continue
          rows.push(j)
        }catch{}
      }
    }
    let total=0, errs=0, timeouts=0
    const perRoute: Record<string, number[]> = {}
    const errSig: Record<string, number> = {}
    for (const j of rows){
      total++
      const st = Number(j.status||0); if (st>=500) errs++
      if (st===504) timeouts++
      const r = j.route || j.path || 'unknown'
      const ms = Number(j.duration_ms || j.latency_ms || 0); if (ms){ (perRoute[r] ||= []).push(ms) }
      if (st>=400){ const sig = `${st} ${(j.error_code||'')}`.trim(); errSig[sig] = (errSig[sig]||0)+1 }
    }
    function quant(arr:number[], p:number){ if(!arr.length) return 0; arr.sort((a,b)=>a-b); const n=arr.length; return arr[Math.max(0, Math.floor(p*n)-1)]|0 }
    const routeRows = Object.entries(perRoute).map(([r,arr])=>({ route:r, count: arr.length, p95Ms: quant(arr,0.95), p99Ms: quant(arr,0.99) })).sort((a,b)=>b.p95Ms-a.p95Ms).slice(0,10)
    const topErr = Object.entries(errSig).map(([sig,n])=>({sig, n})).sort((a,b)=>b.n-a.n).slice(0,10)
    const errRate = total? (errs/total) : 0
    const md = [
      '# Incident Report (auto-generated)','',
      `Window: ~${Math.round(win/60000)} minutes`,
      `Total requests: ${total}`,
      `Error rate (5xx): ${(errRate*100).toFixed(2)}%`,
      `Timeouts (504): ${timeouts}`,'',
      '## Top routes by p95','route | count | p95 | p99','---|---:|---:|---:',
      ...routeRows.map(r=>`${r.route} | ${r.count} | ${r.p95Ms}ms | ${r.p99Ms}ms`),'',
      '## Top error signatures','signature | count','---|---:',
      ...topErr.map(e=>`${e.sig} | ${e.n}`),'',
      '_Generated from access.ndjson; for RCA hints see `/ops/rca-hints`._'
    ].join('\n')
    res.type('text/markdown').send(md)
  }catch(e:any){ res.status(500).json({ error:'incident_report_error', message:String(e?.message||e) }) }
})
export default router
