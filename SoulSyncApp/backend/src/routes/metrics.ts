import { Router } from 'express'
let client: any = null
try{ client = require('prom-client') }catch{}

const router = Router()

router.get('/metrics', async (_req, res)=>{ if(process.env.PROMETHEUS_ENABLED!=='1') return res.status(404).send('disabled')

  if(!client) return res.status(404).send('prom-client not installed')
  res.set('Content-Type', client.register.contentType)
  res.end(await client.register.metrics())
})

export default router
