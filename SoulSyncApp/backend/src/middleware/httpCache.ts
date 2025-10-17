import type { Request, Response, NextFunction } from 'express'

const ENABLED = process.env.ENABLE_HTTP_CACHE === 'true'
const MAX_AGE = Number(process.env.HTTP_CACHE_MAX_AGE || 60)

export function httpCache(req: Request, res: Response, next: NextFunction) {
  if (!ENABLED || req.method !== 'GET') return next()
  res.setHeader('Cache-Control', `public, max-age=${MAX_AGE}`)
  next()
}
