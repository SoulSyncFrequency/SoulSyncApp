import rateLimit from 'express-rate-limit'
import { Router } from 'express'
import swaggerUi from 'swagger-ui-express'

const r = Router()
const docsLimiter = rateLimit({ windowMs: 60*1000, max: 10 })

const spec: any = {
  openapi: '3.0.0',
  info: { title: 'SoulSync API', version: '1.0.0' },
  paths: {
    '/livez': { get: { summary: 'Liveness+EventLoopDelay', responses: { '200': { description: 'OK' } } } },
    '/healthz': { get: { summary: 'Liveness', responses: { '200': { description: 'OK' } } } },
    '/readyz':  { get: { summary: 'Readiness', responses: { '200': { description: 'OK' }, '503': { description: 'Not Ready' } } } },
    '/metrics': { get: { summary: 'Prometheus metrics', responses: { '200': { description: 'OK' } } } }
  }
}

r.get('/api/openapi.json', (_req,res)=> {
  try {
    const fs = require('fs')
    const path = require('path')
    const gen = path.resolve(process.cwd(), 'backend', 'openapi', 'openapi.json')
    if(fs.existsSync(gen)){
      res.type('application/json').send(fs.readFileSync(gen, 'utf8'))
      return
    }
  } catch {}
  return res.json(spec)
})
r.use('/api/docs', docsLimiter, swaggerUi.serve, swaggerUi.setup(spec))

export default r
