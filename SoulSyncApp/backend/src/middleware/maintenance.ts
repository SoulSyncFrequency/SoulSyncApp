
import type { Request, Response, NextFunction } from 'express'

const ALLOW = new Set(['/health','/live','/ready','/metrics','/version','/openapi.json','/csp-report'])

export function maintenanceMode(){
  return (req: Request, res: Response, next: NextFunction) => {
    const on = (process.env.MAINTENANCE_MODE || 'false').toLowerCase() === 'true'
    if (!on || ALLOW.has(req.path)) return next()
    res.setHeader('Retry-After', '60')
    return res.status(503).json({ error: 'maintenance', retryAfter: 60 })
  }
}
