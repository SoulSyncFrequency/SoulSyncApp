import { logger } from './logger'
import webpush from 'web-push'
import { listSubscriptions } from './db'

export function configureWebPush(){
  const publicKey = process.env.VAPID_PUBLIC_KEY || ''
  const privateKey = process.env.VAPID_PRIVATE_KEY || ''
  const subject = process.env.VAPID_SUBJECT || 'mailto:dev@soulsync.app'
  if(!publicKey || !privateKey){
    logger.warn('[push] VAPID keys missing. Generate with: npm run gen:vapid')
  }
  webpush.setVapidDetails(subject, publicKey, privateKey)
}

export async function broadcastNotification(payload: unknown){
  const subs = await listSubscriptions()
  const results: unknown[] = []
  for(const sub of subs){
    try{
      await webpush.sendNotification(sub, JSON.stringify(payload))
      results.push({ ok:true })
    }catch(e: unknown){
      results.push({ ok:false, error: String(e) })
    }
  }
  return results
}
