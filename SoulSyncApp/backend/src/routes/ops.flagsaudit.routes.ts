
import { Router } from 'express'
import crypto from 'crypto'

const router = Router()
router.get('/ops/flags-audit', (_req, res) => {
  try{
    const allow = (process.env.OPS_FLAG_KEYS || 'FEATURE_*,FLAG_*,PREGNENOLONE_FEATURE_ENABLED,PROGESTE_FEATURE_ENABLED').split(',').map(s=>s.trim()).filter(Boolean)
    const out: Record<string, string|undefined> = {}
    const env = process.env
    function match(key:string, pat:string){
      if (pat.endsWith('*')) return key.startsWith(pat.slice(0,-1))
      return key===pat
    }
    for (const k of Object.keys(env)){
      if (allow.some(pat=>match(k, pat))){
        out[k] = env[k]
      }
    }
    const json = JSON.stringify(out, Object.keys(out).sort())
    const sha = crypto.createHash('sha256').update(json).digest('hex')
    res.json({ ok:true, keys: Object.keys(out).sort(), sha256: sha, flags: out })
  }catch(e:any){
    res.status(500).json({ error:'flags_audit_error', message:String(e?.message||e) })
  }
})
export default router
