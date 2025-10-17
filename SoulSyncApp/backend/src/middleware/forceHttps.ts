
import type { Request, Response, NextFunction } from 'express'

export function forceHttps(){
  return (req: Request, res: Response, next: NextFunction) => {
    const on = (process.env.FORCE_HTTPS || 'false').toLowerCase() === 'true'
    if (!on) return next()
    const proto = (req.headers['x-forwarded-proto'] as string) || (req.protocol)
    if (proto && proto.toLowerCase() === 'https') return next()
    const host = req.headers['host']
    const url = 'https://' + host + req.originalUrl
    res.redirect(308, url)
  }
}
