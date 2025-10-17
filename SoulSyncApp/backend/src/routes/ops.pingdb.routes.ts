
import { Router } from 'express'
import { prisma } from '../db/client'
const router = Router()

router.get('/ops/ping-db', async (_req, res) => {
  try{
    await prisma.$queryRaw`SELECT 1`
    res.status(204).end()
  }catch(e:any){
    res.status(503).json({ error:'db_unavailable', message:String(e?.message||e) })
  }
})

export default router
