import { Request, Response, NextFunction } from 'express'

const SENSITIVE_KEYS = [/password/i,/token/i,/secret/i,/key/i]

export function redactSensitive(req:Request, res:Response, next:NextFunction){
  function cleanse(obj:any){
    if(!obj || typeof obj !== 'object') return obj
    const out:any = Array.isArray(obj)?[]:{}
    for(const [k,v] of Object.entries(obj)){
      if(SENSITIVE_KEYS.some(r=>r.test(k))){
        out[k] = '***REDACTED***'
      }else if(typeof v==='object'){
        out[k] = cleanse(v)
      }else{
        out[k] = v
      }
    }
    return out
  }
  ;(req as any).sanitizedBody = cleanse(req.body)
  ;(req as any).sanitizedQuery = cleanse(req.query)
  next()
}
