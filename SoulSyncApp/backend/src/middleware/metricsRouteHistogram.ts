import type { Request, Response, NextFunction } from 'express'
import { Histogram, Summary } from 'prom-client'


function parseBuckets(env?: string){
  if (!env) return [0.01,0.02,0.05,0.1,0.2,0.5,1,2,5,10]
  const arr = env.split(',').map(s=>Number(s.trim())).filter(n=>!Number.isNaN(n) && n>0)
  return arr.length ? arr : [0.01,0.02,0.05,0.1,0.2,0.5,1,2,5,10]
}
const buckets = parseBuckets(process.env.METRICS_HTTP_BUCKETS)

const histogram = new Histogram({
  name: 'http_server_request_duration_seconds',
  help: 'HTTP request duration per route',
  labelNames: ['method','route','status'],
  buckets
})

export function metricsRouteHistogram(req: Request, res: Response, next: NextFunction){
  const start = process.hrtime.bigint()
  res.on('finish', () => {
    const end = process.hrtime.bigint()
    const seconds = Number(end - start) / 1e9
    const route = (req.route && req.route.path) || req.originalUrl.split('?')[0] || 'unknown'
    histogram.labels(req.method, route, String(res.statusCode)).observe(seconds)
    durationSummary.labels(req.method, route, String(res.statusCode)).observe(seconds)
  })
  next()
}


const durationSummary = new Summary({
  name: 'http_server_request_duration_summary_seconds',
  help: 'HTTP request duration summary per route',
  labelNames: ['method','route','status'],
  percentiles: [0.5,0.9,0.99]
})
