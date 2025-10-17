
import { Router, json, text } from 'express'
import { webhookVerify } from '../middleware/webhookVerify'

const router = Router()

// Use text() so we can HMAC raw string exactly; many providers send JSON text
router.post('/webhooks/example', text({ type: '*/*' }), (req: any, res, next) => {
  (req as any).rawBody = req.body
  next()
}, webhookVerify('example'), (req, res) => {
  // If verification passed, parse JSON if possible
  let payload:any = null
  try { payload = JSON.parse(String((req as any).rawBody||'')) } catch {}
  res.status(200).json({ ok: true, received: !!payload })
})

export default router
