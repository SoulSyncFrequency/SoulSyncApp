import { requestWithCB } from './lib/httpClient'
import { env } from './config'
import { PrismaClient } from '@prisma/client'
import { attachPrismaSlowLogger } from '../lib/prismaSlowLog'
import { createClient } from 'redis'

const prisma = new PrismaClient()
attachPrismaSlowLogger(prisma)
const redis = env.REDIS_URL ? createClient({ url: env.REDIS_URL }) : null
if (redis) redis.connect().catch(()=>{})

const DB_LATENCY_WARN_MS = 300
const REDIS_MEM_WARN_MB = 200

async function checkDb(){
  const start = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    const ms = Date.now() - start
    if (ms > DB_LATENCY_WARN_MS) {
      console.warn(`[self-heal] DB latency high: ${ms}ms`); notifySlack(`:warning: DB latency high: ${ms}ms`)
    }
  } catch (e){
    console.error('[self-heal] DB error', e); notifySlack(':rotating_light: DB error')
  }
}

async function checkRedis(){
  if (!redis) return
  try {
    const info = await redis.info('memory')
    const m = /used_memory_human:(\d+\.?\d*)([A-Z]+)/.exec(info) || []
    if (m[2] === 'MB' && Number(m[1]) > REDIS_MEM_WARN_MB){
      console.warn(`[self-heal] Redis memory high: ${m[1]}${m[2]}`); notifySlack(`:warning: Redis memory high: ${m[1]}${m[2]}`)
    }
  } catch (e){
    console.error('[self-heal] Redis error', e); notifySlack(':rotating_light: Redis error')
  }
}

export function startSelfHealing(){
  const every = 5 * 60 * 1000
  setInterval(() => { checkDb(); checkRedis(); }, every)
}

async function notifySlack(text: string){
  const url = process.env.SLACK_WEBHOOK_URL
  if(!url) return
  try {
    const payload = JSON.stringify({ text })
    await requestWithCB(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: payload } as any)
  } catch { /* ignore */ }
}
