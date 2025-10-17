
import { Router } from 'express'
import { redis } from '../services/redis'
const router = Router()

router.get('/ops/ping-redis', async (_req, res) => {
  try{
    await redis.ping()
    res.status(204).end()
  }catch(e:any){
    res.status(503).json({ error:'redis_unavailable', message:String(e?.message||e) })
  }
})

export default router
