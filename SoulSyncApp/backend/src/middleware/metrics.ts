import { logger } from '../logger'
import { httpResponsesByClass } from '../metrics'
import { httpRequestDuration, httpResponseSize } from '../metrics'
import { httpInFlight } from '../metrics'
import { config } from '../config'
import { Request, Response, NextFunction } from 'express'
import { httpRequests, httpDuration } from '../metrics'

export function metricsHttp(req: Request, res: Response, next: NextFunction){
  const start = process.hrtime.bigint()
  res.on('finish', ()=>{ try{ const cls = Math.floor(res.statusCode/100)+'xx'; httpResponsesByClass.inc({ method: req.method, route, class: cls }) }catch{};  try { const dur = Number(process.hrtime.bigint() - startHr) / 1e9; try{ res.setHeader('Server-Timing', `app;dur=${(dur*1000).toFixed(1)}`) }catch{} const status = String(res.statusCode); httpRequestDuration.observe({ method: req.method, route }, dur); const len = Number(res.getHeader('Content-Length')||0); httpResponseSize.observe({ method: req.method, route, status }, isNaN(len)?0:len) } catch {}
  
    const dur = Number(process.hrtime.bigint() - start) / 1e9
    const route = (req.route?.path || req.path || 'unknown').toString()
    const labels = { method: req.method, route, status: String(res.statusCode) }
    try{
      httpRequests.inc(labels as unknown, 1)
      httpDuration.observe(labels as unknown, dur)
    const slowMs = parseInt(config.SLOW_REQ_MS||'750',10)
    if (dur*1000 > slowMs) { try { logger.warn(`[SLOW] ${req.method} ${route} ${res.statusCode} ${Math.round(dur*1000)}ms`) } catch {} }
    }catch{}
  })
  next()
}
