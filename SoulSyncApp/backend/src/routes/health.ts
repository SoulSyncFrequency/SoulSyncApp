import { Router } from 'express'
import { prisma } from '../db/prismaClient'
import { connection as redisConn, hasQueue } from '../queue/queue'

let PDFDocument: any
try { PDFDocument = require('pdfkit') } catch {}

const router = Router()

router.get('/readyz', async (_req, res)=>{
  const checks: any = { prisma: null, redis: null, pdfkit: !!PDFDocument, queues: hasQueue }
  // Prisma (optional)
  if(prisma){
    try{ await prisma.$connect(); checks.prisma = true } catch{ checks.prisma = false }
  }
  // Redis
  checks.redis = !!(redisConn && (redisConn as any).status === 'ready')
  const ok = Object.values(checks).every(v => v !== false)
  res.status(ok ? 200 : 503).json({ ok, checks })
})

export default router
