
import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { attachPrismaSlowLogger } from '../lib/prismaSlowLog'
import { requireApiKey } from '../middleware/apiKey'
import { perKeyRateLimiter } from '../middleware/tierPricing'
import { clampPageLimit } from '../lib/pagination'

const prisma = new PrismaClient()
attachPrismaSlowLogger(prisma)
const router = Router()

router.use(requireApiKey(), perKeyRateLimiter())

// List plans (optionally filtered by type)
router.get('/api/supplements/plans', async (req:any, res:any) => {
  const { type } = req.query || {}
  const { page, limit, offset } = clampPageLimit(req.query)
  const where:any = { userId: req.user.id }
  if (type) where.type = String(type)
  const total = await prisma.supplementPlan.count({ where })
  const items = await prisma.supplementPlan.findMany({ where, orderBy:{ createdAt:'desc' }, skip: offset, take: limit })
  res.json({ page, limit, total, items })
})

// Cross-supplement summary (counts per type)
router.get('/api/supplements/summary', async (req:any, res:any) => {
  const plans = await prisma.supplementPlan.groupBy({ by:['type','status'], where:{ userId: req.user.id }, _count:{ _all:true } as any })
  res.json({ byType: plans })
})

// NDJSON export of doses in range
router.get('/api/supplements/export', async (req:any, res:any) => {
  const from = req.query.from? new Date(String(req.query.from)) : new Date(0)
  const to = req.query.to? new Date(String(req.query.to)) : new Date()
  const doses = await prisma.supplementDose.findMany({ where: { userId: req.user.id, ts: { gte: from, lte: to } }, orderBy:{ ts:'asc' } })
  res.setHeader('Content-Type','application/x-ndjson; charset=utf-8')
  for (const d of doses){
    res.write(JSON.stringify(d) + '\n')
  }
  res.end()
})


// CSV export
router.get('/api/supplements/export.csv', async (req:any, res:any) => {
  const from = req.query.from? new Date(String(req.query.from)) : new Date(0)
  const to = req.query.to? new Date(String(req.query.to)) : new Date()
  const doses = await prisma.supplementDose.findMany({ where: { userId: req.user.id, ts: { gte: from, lte: to } }, orderBy:{ ts:'asc' } })
  res.setHeader('Content-Type','text/csv; charset=utf-8')
  res.setHeader('Content-Disposition','attachment; filename="supplements.csv"')
  const header = ['id','planId','userId','ts','amount','unit','route','note']
  res.write(header.join(',') + '\n')
  for (const d of doses){
    const row = [d.id, d.planId, d.userId, d.ts.toISOString(), d.amount, d.unit, d.route, (d.note||'').replace(/\n|\r|,|"/g,' ')]
    res.write(row.join(',') + '\n')
  }
  res.end()
})

export default router

