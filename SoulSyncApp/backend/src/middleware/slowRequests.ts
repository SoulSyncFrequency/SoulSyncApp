import type { Request, Response, NextFunction } from 'express'

const DEFAULT_THRESHOLD = Number(process.env.SLOW_REQ_THRESHOLD_MS || 500)

export function slowRequests(threshold = DEFAULT_THRESHOLD) {
  return async function slow(req: Request, res: Response, next: NextFunction) {
    const start = performance.now ? performance.now() : Date.now()
    res.on('finish', () => {
      const end = performance.now ? performance.now() : Date.now()
      const ms = Math.round((end as number) - (start as number))
      if (ms >= threshold) {
        const userId = (req as any).user?.id || (req as any).session?.userId || 'anon'
        req.log?.warn?.({ ms, path: req.path, method: req.method, userId }, 'slow_request')
      }
    })
    next()
  }
}
