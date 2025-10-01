import { prisma } from '../db/prismaClient'

export async function logToDb(level: string, message: string, ctx?: unknown){
  try{
    if(!prisma) return
    await (prisma as unknown).systemLog.create({ data: { level, message: String(message).slice(0,800), ctx, reqId: ctx?.reqId || null } })
  }catch(e: unknown){
    // avoid throwing
  }
}
