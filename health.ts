import { Router } from 'express'

const router = Router()

let healthy = true
let ready = false
let startTime = Date.now()

export function setReady(v: boolean){ ready = v }
export function setHealthy(v: boolean){ healthy = v }

router.get('/health', (_req, res) => {
  res.json({ status: healthy ? 'ok' : 'degraded', uptime_ms: Date.now()-startTime })
})
router.get('/livez', (_req, res) => {
  if (healthy) return res.status(200).send('OK')
  return res.status(500).send('NOT_OK')
})
router.get('/readyz', (_req, res) => {
  if (ready) return res.status(200).send('READY')
  return res.status(503).send('NOT_READY')
})

export default router
