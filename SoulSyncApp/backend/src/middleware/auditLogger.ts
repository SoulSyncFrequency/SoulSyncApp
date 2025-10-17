import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../db/prismaClient'
import { redactPII } from '../ai/safe'

export async function auditLogger(req: Request, _res: Response, next: NextFunction){
  try{
    const skip = ['/healthz','/readyz','/livez','/metrics','/api/openapi.json','/csp/report']
    if (skip.includes(req.path)) return next()

    const bodyRedacted = (req as any).redactedBody || (req.body ? redactPII(JSON.stringify(req.body)) : null)

    const entry:any = {
      userId: (req as any).user?.id || null,
      action: `${req.method}`,
      path: req.path,
      ip: req.ip || null,
      userAgent: req.headers['user-agent'] || null,
      meta: { query: req.query || {}, rid: (req as any).requestId || null },
      body: bodyRedacted
    }

    try{
      const prev = await (prisma as any).auditLog.findFirst({ orderBy:{ id:'desc' } })
      const prevHash = prev?.meta?.hash || ''
      const crypto = require('crypto')
      const hash = crypto.createHash('sha256').update(prevHash + JSON.stringify(entry)).digest('hex')
      entry.meta = { ...(entry.meta||{}), hash }
    }catch{}

    ;(prisma as any).auditLog.create({ data: entry }).catch(()=>{})
  }catch{}
  next()
}
