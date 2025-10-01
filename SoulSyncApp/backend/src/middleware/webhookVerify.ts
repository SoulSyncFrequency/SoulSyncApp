
import type { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'

/**
 * Verifies HMAC SHA-256 signature for webhook requests.
 * Expects header 'x-signature' in the form: sha256=<hexdigest>
 * Secrets are provided via ENV map WEBHOOK_SECRETS='{"route": "secret"}' or single WEBHOOK_SECRET.
 * Body must be raw string; ensure raw body middleware for these routes (e.g., express.text()).
 */
export function webhookVerify(routeKey: string){
  const mapRaw = process.env.WEBHOOK_SECRETS || ''
  let map:any = {}
  try{ map = mapRaw? JSON.parse(mapRaw): {} }catch{ map = {} }
  const fallback = process.env.WEBHOOK_SECRET || ''
  const secret = map[routeKey] || fallback
  return (req: Request, res: Response, next: NextFunction)=>{
    if (!secret) return res.status(500).json({ error:'webhook_secret_missing' })
    const sig = String(req.headers['x-signature']||'')
    const [alg, value] = sig.split('=',2)
    if ((alg||'').toLowerCase()!=='sha256' || !value) return res.status(401).json({ error:'unauthorized' })
    const h = crypto.createHmac('sha256', secret).update(String((req as any).rawBody || req.body || '')).digest('hex')
    if (!crypto.timingSafeEqual(Buffer.from(value), Buffer.from(h))) return res.status(401).json({ error:'unauthorized' })
    return next()
  }
}
