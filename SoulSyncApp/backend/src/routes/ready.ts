import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { attachPrismaSlowLogger } from '../lib/prismaSlowLog'
import { createClient } from 'redis'

const r = Router()
const prisma = new PrismaClient()
attachPrismaSlowLogger(prisma)
let redisClient: ReturnType<typeof createClient> | null = null

r.get('/readyz', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
  } catch (e:any) {
    return res.status(503).json({ status: 'not-ready', db: 'down' })
  }
  const url = process.env.REDIS_URL
  if (url) {
    try {
      if (!redisClient) { redisClient = createClient({ url }); await redisClient.connect() }
      const pong = await redisClient.ping()
      if (pong !== 'PONG') throw new Error('redis not PONG')
    } catch (e:any) {
      return res.status(503).json({ status: 'not-ready', redis: 'down' })
    }
  }
  return res.json({ status: 'ready' })
})

export default r
