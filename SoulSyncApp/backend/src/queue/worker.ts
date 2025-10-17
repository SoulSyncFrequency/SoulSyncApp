import { Queue, Worker, JobsOptions } from 'bullmq'
import { logger } from '../logger'

const redisUrl = process.env.REDIS_URL
if (!redisUrl) {
  logger.warn('Worker: no REDIS_URL, exiting')
  process.exit(0)
}

export const reportWorker = new Worker('reports', async job => {
  logger.info({ jobId: job.id, name: job.name }, 'Processing report job')
  // TODO: implement real job
  await new Promise(r => setTimeout(r, 100))
}, {
  connection: { url: redisUrl },
  attempts: 5,
  backoff: { type: 'exponential', delay: 30000 }
})

reportWorker.on('completed', (job) => logger.info({ jobId: job.id }, 'Report job done'))
reportWorker.on('failed', (job, err) => logger.error({ jobId: job?.id, err }, 'Report job failed'))

reportWorker.on('failed', (job, err) => {
  job.moveToFailed({ message: err?.message || 'error' }, true)
})


import { Queue } from 'bullmq'
const dlq = new Queue('reports:failed', { connection: { url: redisUrl! } })
reportWorker.on('failed', async (job, err) => {
  try {
    await dlq.add('failed', { original: job?.data, name: job?.name, failedAt: new Date().toISOString(), error: String(err) }, { attempts: 1, removeOnComplete: 1000 })
  } catch {}
})
