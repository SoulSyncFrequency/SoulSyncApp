import type { Request, Response, NextFunction } from 'express'
import logger from '../logger'

const THRESH_MS = Number(process.env.SLOW_REQUEST_MS || 1000)

export function slowRequest(req: Request, res: Response, next: NextFunction){
  const start = Date.now()
  res.on('finish', () => {
    const ms = Date.now() - start
    if (ms >= THRESH_MS){
      logger.warn({ ms, method: req.method, url: req.originalUrl, status: res.statusCode }, 'slow_request')
    }
  })
  next()
}
