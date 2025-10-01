import type { Request, Response, NextFunction } from 'express'
import { RateLimiterMemory } from 'rate-limiter-flexible'

// Example: per-route configs
const configs: Record<string, { points: number, duration: number }> = {
  
  
  
  '/api/admin/datasheet/pdf': { points: 6, duration: 60 },
'/api/admin/suggestions/apply': { points: 10, duration: 60 },
'/api/f0score': { points: 30, duration: 60 },
'/auth/login': { points: 5, duration: 60 },
  '/auth/register': { points: 10, duration: 60 }
}
const limiters: Record<string, any> = {}
for (const [route, cfg] of Object.entries(configs)){
  limiters[route] = new RateLimiterMemory(cfg)
}

export function perRouteRateLimit(req: Request, res: Response, next: NextFunction){
  const path = Object.keys(configs).find(r => req.path.startsWith(r))
  if (!path) return next()
  const limiter = limiters[path]
  limiter.consume(req.ip)
    .then((rateRes: any) => {
      res.setHeader('X-RateLimit-Limit', configs[path].points)
      res.setHeader('X-RateLimit-Remaining', rateRes.remainingPoints)
      res.setHeader('X-RateLimit-Reset', Math.floor((Date.now() + rateRes.msBeforeNext)/1000))
      next()
    })
    .catch(() => {
      res.setHeader('Retry-After', configs[path].duration)
      res.status(429).json({ error: { code: 'rate_limited', message: 'Too many requests for this route' } })
    })
}


// NOTE: If REDIS_URL present, consider using a Redis store for rate limits to work across replicas.
