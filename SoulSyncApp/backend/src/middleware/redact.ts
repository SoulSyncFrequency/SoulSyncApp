import { Request, Response, NextFunction } from 'express'

const SENSITIVE_KEYS = [/password/i, /token/i, /secret/i, /key$/i]

function redact(obj: any){
  if (!obj || typeof obj !== 'object') return obj
  const out: any = Array.isArray(obj) ? [] : {}
  for (const [k, v] of Object.entries(obj)){
    if (SENSITIVE_KEYS.some(rx => rx.test(k))) out[k] = '***REDACTED***'
    else if (v && typeof v === 'object') out[k] = redact(v)
    else out[k] = v
  }
  return out
}

export function redactMiddleware(req: Request, _res: Response, next: NextFunction){
  try {
    if (req.body) (req as any).body = redact(req.body)
    if (req.query) (req as any).query = redact(req.query)
    if (req.headers) {
      const h: any = {}
      for (const [k,v] of Object.entries(req.headers)){
        if (SENSITIVE_KEYS.some(rx => rx.test(k))) h[k] = '***REDACTED***'
        else h[k] = v as any
      }
      ;(req as any).headers = h
    }
  } catch {}
  next()
}
