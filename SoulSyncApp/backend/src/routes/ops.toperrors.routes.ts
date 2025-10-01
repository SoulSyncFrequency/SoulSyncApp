
import { Router } from 'express'
import fs from 'fs'
import path from 'path'

function windowMsFrom(q:any){ const w = String((q?.window||'15m')).toLowerCase(); return w==='5m'? (5*60*1000): w==='60m'? (60*60*1000): (15*60*1000) }

const router = Router()
router.get('/ops/top-errors', (req, res) => {
  try{
    const p = path.join(process.cwd(),'logs','access.ndjson')
    const now = Date.now()
    const win = windowMsFrom(req.query)
    const counts: Record<string, number> = {}
    const routes: Record<string, number> = {}
    let totalErr = 0
    const lines = fs.existsSync(p)? fs.readFileSync(p,'utf-8').split(/\r?\n/).slice(-20000) : []
    for (const line of lines){
      if (!line) continue
      try{
        const j = JSON.parse(line)
        const ts = Number(j.t || j.time || 0) || (j.timestamp? Date.parse(j.timestamp): 0)
        if (ts && (now - ts) > win) continue
        const st = Number(j.status || 0)
        if (st >= 400){
          totalErr++
          const sig = `${st} ${(j.error_code||'')}`.trim()
          counts[sig] = (counts[sig]||0) + 1
          const r = j.route || j.path || 'unknown'
          routes[r] = (routes[r]||0) + 1
        }
      }catch{}
    }
    const top = Object.entries(counts).map(([sig,n])=>({sig, n})).sort((a,b)=>b.n-a.n).slice(0,20)
    const topRoutes = Object.entries(routes).map(([route,n])=>({route, n})).sort((a,b)=>b.n-a.n).slice(0,20)
    res.json({ ok:true, totalErr, top, topRoutes })
  }catch(e:any){
    res.status(500).json({ error:'top_errors_error', message:String(e?.message||e) })
  }
})
export default router
