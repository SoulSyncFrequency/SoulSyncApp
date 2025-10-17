import { Router } from 'express'
import { prisma } from '../db/prismaClient'

const router = Router()

router.get('/system-logs', async (req,res)=>{
  try{
    if(!prisma) return res.json({ items: [] })
    const level = String(req.query.level||'').toUpperCase()
    const q = String(req.query.q||'').trim()
    const days = Number(req.query.days||7)
    const where: unknown = {}
    if(level) where.level = level
    if(q) where.message = { contains: q, mode: 'insensitive' }
    if(days) where.createdAt = { gte: new Date(Date.now() - days*24*60*60*1000) }
    const items = await (prisma as unknown).systemLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: 500 })
    res.json({ items })
  }catch(e: unknown){
    res.status(500).json({ error: e?.message || 'failed' })
  }
})

export default router
