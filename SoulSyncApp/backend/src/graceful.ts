import { PrismaClient } from '@prisma/client'
import * as Sentry from '@sentry/node'
import { createClient } from 'redis'

let prisma: PrismaClient | null = null
let redisClient: ReturnType<typeof createClient> | null = null

export function attachClients(p: PrismaClient, r: ReturnType<typeof createClient>|null){
  prisma = p
  redisClient = r
}

export async function shutdown(signal: string){
  console.log(`Received ${signal}, shutting down gracefully...`)
  try {
    if (prisma){ await prisma.$disconnect() }
    if (redisClient){ await redisClient.disconnect() }
    if (Sentry.getCurrentHub().getClient()){ await Sentry.close(2000) }
  } catch (e){ console.error('Error in shutdown', e) }
  process.exit(0)
}

export function registerSignals(){
  ;['SIGTERM','SIGINT'].forEach(sig=>{
    process.on(sig, ()=>{ shutdown(sig) })
  })
}
