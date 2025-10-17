import type { Request, Response, NextFunction } from 'express'
import { ai } from '../ai'
import { isEnabled } from '../config/flags'

export async function aiAnomaly(req: Request, res: Response, next: NextFunction){
  if (!isEnabled('aiAnom')) return next()
  try {
    const meta = `${req.ip} ${req.path} ${req.method}`
    const result = await ai.classify(meta, { labels:['normal','abuse','bot'] })
    if (result.label === 'abuse' || result.label === 'bot'){
      return res.status(429).json({ error:{code:'too_many_requests', message:'Anomalous traffic blocked'} })
    }
  } catch(e){}
  next()
}
