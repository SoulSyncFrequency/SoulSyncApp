import { logger } from '../logger'
import { Worker, JobsOptions } from 'bullmq'
import IORedis from 'ioredis'
import { sendSingleWebhook } from '../services/webhookService'
import { _sendEmailDirect } from '../services/emailService'

const REDIS_URL = process.env.REDIS_URL || ''

export function startQueueWorkers(){
  if(!REDIS_URL) { logger.info('[queue] REDIS_URL not set; workers disabled'); return }
  const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null })

  // Webhook worker
  const webhookWorker = new Worker('webhookQueue', async job => {
    const { hook, body } = job.data
    await sendSingleWebhook(hook, body)
  }, { connection, concurrency: Number(process.env.WEBHOOK_CONCURRENCY||5) })

  // Email worker
  const emailWorker = new Worker('emailQueue', async job => {
    const { to, subject, html, attachments } = job.data
    await _sendEmailDirect(to, subject, html, attachments)
  }, { connection, concurrency: Number(process.env.EMAIL_CONCURRENCY||3) })

  logger.info('[queue] workers started')
}


  // DLQ wiring
  const { Queue } = await import('bullmq')
  const webhookDlq = new Queue('webhookQueue:dlq', { connection })
  webhookWorker.on('failed', async (job, err) => {
    try { await webhookDlq.add('failed', { original: job?.data, jobId: job?.id, name: job?.name, error: String(err) }, { removeOnComplete: 1000 }) } catch {}
  })
  const emailDlq = new Queue('emailQueue:dlq', { connection })
  emailWorker.on('failed', async (job, err) => {
    try { await emailDlq.add('failed', { original: job?.data, jobId: job?.id, name: job?.name, error: String(err) }, { removeOnComplete: 1000 }) } catch {}
  })
