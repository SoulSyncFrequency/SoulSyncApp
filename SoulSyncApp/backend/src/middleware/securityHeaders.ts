import { Request, Response, NextFunction } from 'express'

import { config } from '../config'
export function securityHeaders(req: Request, res: Response, next: NextFunction){
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('X-XSS-Protection', '0')
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  try{ if(String(config.ROBOTS_INDEX||'false').toLowerCase()!=='true'){ res.setHeader('X-Robots-Tag','noindex, nofollow') } }catch{}
  res.setHeader('Origin-Agent-Cluster','?1')
  res.setHeader('Cross-Origin-Resource-Policy','same-site')
  res.setHeader('Cross-Origin-Opener-Policy','same-origin')
  const coepHeader = (String(config.COEP_ENFORCE||'false').toLowerCase()==='true') ? 'Cross-Origin-Embedder-Policy' : 'Cross-Origin-Embedder-Policy-Report-Only'
  res.setHeader(coepHeader,'require-corp')
  // Optional HSTS (only enable behind HTTPS)
  try {
    const enableHsts = (config.ENABLE_HSTS||'false').toLowerCase() === 'true'
    const proto = (req.headers['x-forwarded-proto'] as string) || ''
    if (enableHsts && (proto == 'https' || (req.secure as unknown))) {
      const max = parseInt(config.HSTS_MAX_AGE || '15552000',10)
      res.setHeader('Strict-Transport-Security', `max-age=${max}; includeSubDomains${(String(config.HSTS_PRELOAD||'false').toLowerCase()==='true')?'; preload':''}`)
    }
  } catch {}
  res.setHeader('X-DNS-Prefetch-Control','off')
  res.setHeader('X-Download-Options','noopen')
  res.setHeader('X-Permitted-Cross-Domain-Policies','none')
  next()
}
