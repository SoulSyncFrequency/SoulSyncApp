
import { Router } from 'express'

const router = Router()
router.get('/ops/env/redact-export', (_req, res) => {
  try{
    const allow = (process.env.OPS_ENV_EXPORT_KEYS || 'NODE_ENV,MAINTENANCE_MODE,ENABLE_COOP_COEP,CSP_REPORT_ONLY,COMPRESSION_ENABLED,PREGNENOLONE_FEATURE_ENABLED,PROGESTE_FEATURE_ENABLED').split(',').map(s=>s.trim()).filter(Boolean)
    const out: Record<string,string|null> = {}
    for (const k of allow){
      const v = process.env[k]
      if (typeof v === 'undefined') { out[k] = null; continue }
      const lower = k.toLowerCase()
      const looksSecret = /key|secret|token|password|pass|pwd/i.test(lower)
      out[k] = looksSecret ? (v.length>6? (v[:3]+'***'+v[-2:]): '***') : v
    }
    res.json({ ok:true, keys: allow, env: out })
  }catch(e:any){
    res.status(500).json({ error:'env_export_error', message:String(e?.message||e) })
  }
})

export default router
