import { Router } from 'express'
import { clampPageLimit } from '../lib/pagination'
import { broadcastNotification } from '../push'
import { addSubscription } from '../db'
import { strictLimiter } from '../middleware/rateLimit'
import { sendAll } from '../pushSend'
import { listDevices } from '../db'

const router = Router()

router.post('/subscribe', async (req,res)=>{
  const sub = req.body
  if(!sub || !sub.endpoint) return res.status(400).json({ ok:false, error:'invalid subscription' })
  await addSubscription(sub)
  return res.json({ ok:true })
})

router.post('/send', strictLimiter, async (req,res)=>{
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ')?auth.slice(7):'';
  if(!token || token !== process.env.ADMIN_SECRET){ return res.status(401).json({ ok:false, error:'unauthorized' }) }

  const { title='SoulSync', body='Test notification', data={}, segment } = req.body || {}
  const results = await broadcastNotification({ title, body, data })
  const targets = segment ? (await listDevices()).filter((d: unknown)=>d.segment===segment).map((d: unknown)=>d.token) : undefined
  const x = await sendAll(title, body, data, targets)
  return res.json({ ok:true, results, mobile: x })
})

export default router
