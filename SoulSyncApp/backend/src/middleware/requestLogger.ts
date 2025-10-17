
import type { Request, Response, NextFunction } from 'express'
import fs from 'fs'
import path from 'path'

const REQ_LOG = path.join(process.cwd(),'logs','requests.ndjson')
const MAX_BODY = 1024 * 4 // 4KB cap for logged body

function sanitize(obj:any){
  try{
    if (!obj || typeof obj!=='object') return obj
    const redacted:any = Array.isArray(obj)? [] : {}
    const redactRe = /(password|pass|pwd|secret|token|key|auth|card|ssn)/i
    let size = 0
    for (const [k,v] of Object.entries(obj)){
      let val:any = v
      if (redactRe.test(k)) val = '[REDACTED]'
      if (typeof val==='object') val = '[object]'
      const piece = JSON.stringify(val||'')
      size += piece.length
      if (size>MAX_BODY){ redacted[k] = '[TRUNCATED]'; break }
      redacted[k]=val
    }
    return redacted
  }catch{ return {} }
}

export function requestLogger(){
  return (req:Request, res:Response, next:NextFunction)=>{
    if ((process.env.REQ_LOGGER_ENABLED||'false').toLowerCase()!=='true') return next()
    try{
      fs.mkdirSync(path.dirname(REQ_LOG), { recursive: true })
      const rec = {
        t: Date.now(),
        ip: (req.headers['x-forwarded-for']||req.socket.remoteAddress||'').toString(),
        method: req.method,
        path: req.path,
        status: undefined as any,
        duration_ms: undefined as any,
        body: sanitize(req.body),
        ua: (req.headers['user-agent']||'').toString()
      }
      const start = Date.now()
      res.on('finish', ()=>{
        try{
          rec.status = res.statusCode
          rec.duration_ms = Date.now()-start
          fs.appendFile(REQ_LOG, JSON.stringify(rec)+'\n', ()=>{})
        }catch{}
      })
    }catch{}
    next()
  }
}
