import type { Request, Response, NextFunction } from 'express'
import { redactPII } from '../ai/safe'

export function redactPIIMiddleware(req: Request, _res: Response, next: NextFunction){
  try{
    const raw = (req as any).rawBody || req.body
    if(raw){
      const serialized = typeof raw==='string' ? raw : JSON.stringify(raw)
      ;(req as any).redactedBody = redactPII(serialized)
    }
  }catch{ /* noop */ }
  next()
}
