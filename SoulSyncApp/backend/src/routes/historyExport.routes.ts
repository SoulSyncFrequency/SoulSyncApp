import { withEtag, withLastModified } from '../utils/etag'
import { Router } from 'express'
import { gateFeature } from '../config/flags'
import { requireAuth } from '../middleware/requireAuth'
import { prisma as prismaMaybe } from '../db/prismaClient'

const r = Router()

r.get('/history/export.csv', gateFeature('gdprApi'), requireAuth, async (req, res) => {
  if (!prismaMaybe) return res.status(501).json({ error:{ code:'not_supported', message:'Prisma not configured' } })
  const prisma = prismaMaybe as any
  const userId = (req as any).user?.id || ''
  const list = await prisma.auditLog?.findMany ? prisma.auditLog.findMany({ where:{ userId }, orderBy:{ createdAt:'desc' }, take: 5000 }) : []
  const header = ['time','action','path']
  const rows = [header.join(',')]
  for (const it of list){
    rows.push([new Date(it.createdAt).toISOString(), it.action, it.path].map(x=>String(x).replaceAll(',',';')){}.join(',')){}
  }
  const csv = rows.join('\n')
  res.setHeader('Content-Type','text/csv')
  res.setHeader('Content-Disposition','attachment; filename="history.csv"')
  if(!withEtag(res, csv)
})

export default r
