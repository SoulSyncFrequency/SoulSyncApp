import { logger } from '../logger'
import { Router } from 'express'
const router = Router()

router.post('/', (req,res)=>{
  // Placeholder: ovdje kasnije povezati FCM/APNs ili web push
  logger.info('Notify payload:', req.body)
  return res.json({ ok: true })
})

export default router
