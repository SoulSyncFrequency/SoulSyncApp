import { Request, Response, NextFunction } from 'express'
import { config } from '../config'

export function hostAllowlist(req: Request, res: Response, next: NextFunction){
  try{
    const raw = (config.ALLOWED_HOSTS || '').trim()
    if (!raw) return next() // allow all if not configured
    const allowed = raw.split(',').map(s=>s.trim().toLowerCase()).filter(Boolean)
    const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').toLowerCase()
    if (!host) return res.status(400).json({ error: 'Invalid Host header' })
    const hostname = host.split(':')[0]
    if (hostname === 'localhost' || hostname === '127.0.0.1') return next()
    if (allowed.includes(hostname)) return next()
    return res.status(400).json({ error: 'Host not allowed' })
  }catch{
    return res.status(400).json({ error: 'Host validation failed' })
  }
}
