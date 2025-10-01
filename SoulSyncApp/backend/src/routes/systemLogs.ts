import { Router } from 'express'
import { prisma } from '../db/prismaClient'

const router = Router()

router.get('/system-logs', async (req,res)=>{
  try{
    if(!prisma) return res.json({ items: [] })
    const level = String(req.query.level||'').toUpperCase()
    const search = String(req.query.search||'').trim()
    const take = Math.min(Number(req.query.take||200), 1000)
    const where: unknown = {}
    if(level) where.level = level
    if(search) where.message = { contains: search, mode:'insensitive' }
    const items = await (prisma as unknown).systemLog.findMany({ where, orderBy: { createdAt: 'desc' }, take })
    res.json({ items })
  }catch(e: unknown){
    res.status(500).json({ error: e?.message || 'system logs failed' })
  }
})

export default router
