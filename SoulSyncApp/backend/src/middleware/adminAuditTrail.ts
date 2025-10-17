import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const SENSITIVE = /token|secret|password|key|authorization/i

function maskValue(v:any){
  if(v==null) return v
  if(typeof v==='string'){
    if(SENSITIVE.test(v)) return '***'
    if(v.length>80) return v.slice(0,20)+'…'+v.slice(-5)
    return v
  }
  return v
}
function maskObject(o:any, depth=0){
  if(!o || typeof o!=='object' || depth>4) return o
  const out:any = Array.isArray(o)? []:{} 
  for(const k of Object.keys(o)){
    if(SENSITIVE.test(k)){ out[k]='***'; continue }
    const v = o[k]
    if(typeof v==='object') out[k]=maskObject(v, depth+1)
    else out[k]=maskValue(v)
  }
  return out
}

export function adminAuditTrail(){
  return (req:any, res:any, next:any)=>{
    if(!/^\/api\/admin\b/.test(String(req.path||''))) return next()
    const t0 = Date.now()
    const apiKey = (req.headers['x-api-key'] as string) || (req.query['api_key'] as any) || ''
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip
    const rid = (req as any).requestId
    res.on('finish', ()=>{
      try{
        const role = (res as any).locals?.role || (req as any).role || 'unknown'
        const rec = {
          ts: t0,
          ms: Date.now()-t0,
          method: req.method,
          path: req.originalUrl,
          status: res.statusCode,
          role,
          ip,
          rid,
          key_sha256: apiKey ? crypto.createHash('sha256').update(apiKey).digest('hex') : null,
          q: maskObject(req.query||{}),
          b: maskObject(req.body||{})
        }
        const day = new Date().toISOString().slice(0,10)
        const dir = path.join(process.cwd(),'audit','admin_actions',day)
        fs.mkdirSync(dir,{recursive:true})
        const fn = path.join(dir, String(t0)+'_'+(req.method)+'_'+Buffer.from(req.path).toString('hex').slice(0,16)+'.json')
        fs.writeFile(fn, JSON.stringify(rec,null,2), ()=>{})
      }catch{}
    })
    next()
  }
}
