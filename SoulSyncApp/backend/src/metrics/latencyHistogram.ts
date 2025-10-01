
import type { Request, Response, NextFunction } from 'express'
import { Histogram, Gauge, collectDefaultMetrics, register } from 'prom-client'

collectDefaultMetrics()

export const httpLatency = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request latency per route/method/status',
  labelNames: ['method','route','status_code'],
  buckets: [0.01,0.025,0.05,0.1,0.25,0.5,1,2,5,10]
})

export function latencyMiddleware(){
  return (req: Request, res: Response, next: NextFunction) => {
    const end = httpLatency.startTimer({ method: req.method })
    res.on('finish', () => {
      const route = (req.route && (req.route.path || req.route)) || req.path || 'unknown'
      end({ route, status_code: String(res.statusCode) })
    })
    next()
  }
}

export async function metricsHandler(_req: Request, res: Response){
  res.setHeader('Content-Type', register.contentType)
  res.end(await register.metrics())
}


export const buildInfo = new Gauge({
  name: 'build_info',
  help: 'Static build info',
  labelNames: ['name','version']
})
try {
  const pkg = require('../../package.json')
  buildInfo.set({ name: pkg.name || 'backend', version: pkg.version || 'unknown' }, 1)
} catch {}
