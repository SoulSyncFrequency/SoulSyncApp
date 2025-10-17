import { Router } from 'express'
import { clampPageLimit } from '../lib/pagination'
import { strictLimiter } from '../middleware/rateLimit'
import { listDevices } from '../db'
import { Router } from 'express'
import { clampPageLimit } from '../lib/pagination'
import { updateDevice, listDevices } from '../db'

const router = Router()

// Auth middleware
router.use(strictLimiter)

router.use((req,res,next)=>{
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if(!token || token !== process.env.ADMIN_SECRET){
    return res.status(401).json({ ok:false, error:'unauthorized' })
  }
  next()
})

router.get('/', async (req,res)=>{
  const list = await listDevices()
  return res.json({ ok:true, devices:list })
})

router.patch('/:token', async (req,res)=>{
  const { token } = req.params
  const { userId, segment } = req.body || {}
  const ok = await updateDevice(token, { userId, segment })
  if(!ok) return res.status(404).json({ ok:false, error:'not found' })
  return res.json({ ok:true })
})

export default router
