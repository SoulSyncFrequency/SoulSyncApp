import client from 'prom-client'
import type { NextFunction, Request, Response } from 'express'

// Register default metrics
client.collectDefaultMetrics()

const httpHistogram = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method','route','status_code'],
  buckets: [0.025,0.05,0.1,0.25,0.5,1,2,5,10]
})

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint()
  res.on('finish', () => {
    const end = process.hrtime.bigint()
    const dur = Number(end - start) / 1e9
    const route = (req.route && req.route.path) || req.path
    httpHistogram.labels(req.method, route, String(res.statusCode)).observe(dur)
  })
  next()
}

export function metricsHandler(_req: Request, res: Response) {
  res.set('Content-Type', client.register.contentType)
  res.end(client.register.metrics())
}


export const therapyPrimaryMoleculeCounter = new client.Counter({
  name: 'therapy_primary_molecule_total',
  help: 'Total primary molecule generation events',
  labelNames: ['status']
})


export const dlqPurgedCounter = new client.Counter({
  name: 'dlq_purged_total',
  help: 'Total DLQ jobs purged',
  labelNames: ['queue']
})
