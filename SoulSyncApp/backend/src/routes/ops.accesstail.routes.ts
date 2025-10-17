
import { Router } from 'express'
import fs from 'fs'
import path from 'path'

const router = Router()
router.get('/ops/logs/access-tail', (req, res) => {
  try{
    const n = Math.max(1, Math.min(5000, Number(req.query.lines||200)))
    const p = path.join(process.cwd(),'logs','access.ndjson')
    const out:any[] = []
    if (fs.existsSync(p)){
      const lines = fs.readFileSync(p,'utf-8').split(/\r?\n/).slice(-n)
      for (const line of lines){
        if (!line) continue
        try{
          const j = JSON.parse(line)
          // redact sensitive-ish keys
          if (j.body && typeof j.body==='object'){ j.body = '[REDACTED]' }
          if (j.headers){ j.headers = '[REDACTED]' }
          out.push(j)
        }catch{}
      }
    }
    res.json({ ok:true, lines: out.length, rows: out })
  }catch(e:any){
    res.status(500).json({ error:'access_tail_error', message:String(e?.message||e) })
  }
})
export default router
