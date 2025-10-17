import { Router } from 'express'
import os from 'os'
import process from 'process'

const router = Router()

router.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok' })
})

router.get('/readyz', (_req, res) => {
  // TODO: optionally ping DB here
  res.status(200).json({ ready: true })
})

router.get('/version', (_req, res) => {
  res.json({
    git: process.env.GIT_SHA || 'dev',
    builtAt: process.env.BUILD_TIME || 'dev'
  })
})

let metricsEnabled = false
try {
  require.resolve('prom-client')
  metricsEnabled = true
} catch {}
if (metricsEnabled) {
  const client = require('prom-client')
  const register = new client.Registry()
  client.collectDefaultMetrics({ register })
  router.get('/metrics', async (_req, res) => {
    res.set('Content-Type', register.contentType)
    res.end(await register.metrics())
  })
}

router.get('/admin/diagnostics', (_req, res) => {
  const mem = process.memoryUsage()
  const uptime = process.uptime()
  res.json({
    hostname: os.hostname(),
    uptime,
    memory: mem,
    node: process.version,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN ? 'set' : 'unset',
      SENTRY_DSN: process.env.SENTRY_DSN ? 'set' : 'unset'
    }
  })
})

export default router
