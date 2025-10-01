import { Router } from 'express'
import { addDevice } from '../db'

const router = Router()

router.post('/register', async (req,res)=>{
  const { platform, token, userId, segment } = req.body || {}
  if(!platform || !token) return res.status(400).json({ ok:false, error:'missing platform/token' })
  await addDevice({ platform, token, userId, segment })
  return res.json({ ok:true })
})

export default router
