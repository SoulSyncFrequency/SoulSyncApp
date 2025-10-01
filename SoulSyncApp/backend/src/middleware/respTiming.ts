import { Request, Response, NextFunction } from 'express'
import onHeaders from 'on-headers'

export function respTiming(_req: Request, res: Response, next: NextFunction){
  const start = process.hrtime.bigint()
  onHeaders(res, ()=>{
    const durMs = Number(process.hrtime.bigint() - start) / 1e6
    try {
      res.setHeader('X-Response-Time', `${durMs.toFixed(1)}ms`)
      res.setHeader('Server-Timing', `app;dur=${durMs.toFixed(1)}`)
    } catch {}
  })
  next()
}
