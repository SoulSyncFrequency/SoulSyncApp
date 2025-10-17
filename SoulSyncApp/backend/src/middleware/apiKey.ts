import type { Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'
import { attachPrismaSlowLogger } from '../lib/prismaSlowLog'
import crypto from 'crypto'

const prisma = new PrismaClient()
attachPrismaSlowLogger(prisma)

// Expect headers: x-api-key (raw key), x-signature (HMAC SHA256 over body), x-timestamp (optional)
export function requireApiKey(){
  return async (req: Request, res: Response, next: NextFunction) => {
    const raw = (req.headers['x-api-key'] as string) || ''
    if (!raw) return res.status(401).json({ error:{ code:'missing_api_key' } })
    const candidateHash = crypto.createHash('sha256').update(raw).digest('hex')
    const key = await prisma.apiKey.findFirst({ where: { keyHash: candidateHash } })
    if (!key) return res.status(401).json({ error:{ code:'invalid_api_key' } })

    // Optional HMAC verification
    const sig = (req.headers['x-signature'] as string) || ''
    if (sig){
      const h = crypto.createHmac('sha256', raw).update(JSON.stringify(req.body || {})).digest('hex')
      if (!crypto.timingSafeEqual(Buffer.from(sig,'hex'), Buffer.from(h,'hex'))){
        return res.status(401).json({ error:{ code:'invalid_signature' } })
      }
    }

    ;(req as any).apiKey = { id: key.id, role: key.role, name: key.name }
    await prisma.apiKey.update({ where:{ id: key.id }, data:{ lastUsedAt: new Date() } }).catch(()=>{})
    next()
  }
}
