
import { prisma } from '../db/prismaClient'
import { sendSingleWebhook } from '../services/webhookService'

export async function retryFailedWebhooks(){
  if(!prisma) return
  const failed = await (prisma as unknown).webhookLog.findMany({ where: { status:'FAILED', attempts: { lt: 5 } }, orderBy: { sentAt: 'asc' }, take: 50 })
  for(const log of failed){
    const hook = log.webhookId ? await (prisma as unknown).webhookEndpoint.findUnique({ where: { id: log.webhookId } }) : null
    const target = hook || { id: null, url: log.url, secret: process.env.DEFAULT_WEBHOOK_SECRET||'default', active:true }
    try{
      await sendSingleWebhook(target, log.payload)
      // previous sendSingleWebhook creates a new log; optionally mark this one for history
      await (prisma as unknown).webhookLog.update({ where: { id: log.id }, data: { status:'RETRIED', attempts: log.attempts+1 } })
    }catch{
      await (prisma as unknown).webhookLog.update({ where: { id: log.id }, data: { attempts: log.attempts+1, status: log.attempts+1>=5?'FAILED_PERMANENT':'FAILED' } })
    }
  }
}
