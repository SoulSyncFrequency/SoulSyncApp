import { Router } from 'express'
import crypto from 'crypto'
import { requireAdmin } from '../middleware/auth'

const r = Router()

function weak(val?:string){
  if(!val) return 'missing'
  if(val === 'default' || /change-?me/i.test(val)) return 'default'
  if(val.length < 24) return 'short'
  return ''
}
function entropyScore(val:string){
  try{
    const counts = Array.from(val).reduce((m:any,c)=> (m[c]=(m[c]||0)+1, m), {} as any)
    const H = -Object.values(counts).reduce((a:any,b:any)=> a + (b/val.length)*Math.log2(b/val.length), 0 as any)
    return Math.round(H*10)/10
  }catch{ return 0 }
}

r.get('/admin/health/secrets', requireAdmin, (_req:any,res:any)=>{
  const items = [
    ['JWT_SECRET', process.env.JWT_SECRET],
    ['EXPORT_SIGNING_SECRET', process.env.EXPORT_SIGNING_SECRET],
    ['SESSION_COOKIE_SECRET', process.env.SESSION_COOKIE_SECRET],
    ['ENCRYPTION_KEY', process.env.ENCRYPTION_KEY],
    ['OPENAI_API_KEY', process.env.OPENAI_API_KEY],
    ['SENTRY_DSN', process.env.SENTRY_DSN],
    ['FRONTEND_ORIGIN', process.env.FRONTEND_ORIGIN],
  ] as const

  const checks = items.map(([key, val])=>{
    const status = weak(val)
    const entropy = val ? entropyScore(val) : 0
    return { key, present: !!val, status: status || 'ok', entropy }
  })

  const critical = checks.filter(c=> c.status!=='ok' && ['JWT_SECRET','EXPORT_SIGNING_SECRET','SESSION_COOKIE_SECRET','ENCRYPTION_KEY'].includes(c.key))

  res.json({ ok: critical.length===0, checks })
})

export default r
