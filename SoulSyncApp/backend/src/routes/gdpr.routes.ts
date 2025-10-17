import { withEtag, withLastModified } from '../utils/etag'
import { Router } from 'express'
import { gateFeature } from '../config/flags'
import { requireAuth } from '../middleware/requireAuth'
import { prisma as prismaMaybe } from '../db/prismaClient'

const r = Router()

r.get('/gdpr/export', gateFeature('gdprApi'), requireAuth, async (req, res) => {
  if (!prismaMaybe) return res.status(501).json({ error:{ code:'not_supported', message:'Prisma not configured' } })
  const prisma = prismaMaybe as any
  const userId = (req as any).user?.id || ''
  const [user, sessions, audits] = await Promise.all([
    prisma.user.findUnique({ where:{ id: userId } }),
    prisma.session?.findMany ? prisma.session.findMany({ where:{ userId } }) : [],
    prisma.auditLog?.findMany ? prisma.auditLog.findMany({ where:{ userId }, orderBy:{ createdAt:'desc' }, take: 5000 }) : []
  ])
  res.setHeader('Content-Type','application/json')
  res.setHeader('Content-Disposition','attachment; filename="soulsync_export.json"')
  if(!withEtag(res, JSON.stringify({ user, sessions, audits }, null, 2)){}
})

r.post('/gdpr/delete', gateFeature('gdprApi'), requireAuth, async (req, res) => {
  if (!prismaMaybe) return res.status(501).json({ error:{ code:'not_supported', message:'Prisma not configured' } })
  const prisma = prismaMaybe as any
  const userId = (req as any).user?.id || ''
  try {
    if (prisma.session) await prisma.session.deleteMany({ where:{ userId } })
    if (prisma.auditLog) await prisma.auditLog.deleteMany({ where:{ userId } })
    await prisma.user.update({ where:{ id: userId }, data:{ email: `deleted_${userId}@example.local` } })
    res.json({ ok:true })
  } catch (e:any){
    res.status(500).json({ error:{ code:'server_error', message: e?.message || 'GDPR delete failed' } })
  }
})

export default r
