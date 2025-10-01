import { logger } from '../logger'
import { sendToWebhooks } from './webhookService';
import { notificationsTotal } from '../metrics';
import { deliverToAllActive } from './webhookDeliver';
import { broadcastNotification } from '../routes/notifications.sse';
import { prisma } from '../db/prismaClient'

export type NotificationInput = {
  userId?: number | null
  type: string
  message: string
  meta?: unknown
}

export async function addNotification(input: NotificationInput){
  try{
    if(!prisma) {
      logger.info('[Notification]', input.type, input.message)
      broadcastNotification({ type: input.type, message: input.message, meta: input.meta, id: 0, ts: new Date().toISOString() });
      try{ notificationsTotal.inc({ type: input.type||'unknown' }) }catch{}
      try{ await sendToWebhooks({ type: input.type, message: input.message, meta: input.meta, createdAt: new Date().toISOString() }); }catch{}
      deliverToAllActive({ type: input.type, message: input.message, meta: input.meta, createdAt: new Date().toISOString() });
      return { ok: true, id: 0 }
    }
    const n = await (prisma as unknown).notification.create({
      data: {
        userId: input.userId ?? null,
        type: input.type,
        message: input.message,
        meta: input.meta ?? null
      }
    })
    broadcastNotification({ type: input.type, message: input.message, meta: input.meta, id: n.id, ts: new Date().toISOString() });
    try{ notificationsTotal.inc({ type: input.type||'unknown' }) }catch{}
    try{ await sendToWebhooks({ type: input.type, message: input.message, meta: input.meta, createdAt: new Date().toISOString() }); }catch{}
    deliverToAllActive({ type: input.type, message: input.message, meta: input.meta, createdAt: new Date().toISOString() });
    return { ok: true, id: n.id }
  }catch(e: unknown){
    logger.error('addNotification failed', e?.message || e)
    return { ok:false, error: e?.message || 'failed' }
  }
}