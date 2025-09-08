import client from 'prom-client'
import { Router } from 'express'

const router = Router()

// collect default metrics
client.collectDefaultMetrics()

router.get('/metrics', async (_req, res) => {
  try {
    res.set('Content-Type', client.register.contentType)
    res.end(await client.register.metrics())
  } catch (e) {
    res.status(500).send('metrics_error')
  }
})

export default router
