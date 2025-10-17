import { Queue } from 'bullmq'
import { logger } from '../logger'

export let reportQueue: Queue | null = null

export function bootQueues(redisUrl = process.env.REDIS_URL) {
  if (!redisUrl) {
    logger.info('Queues disabled (no REDIS_URL)')
    return
  }
  reportQueue = new Queue('reports', { connection: { url: redisUrl } })
  logger.info('Queues booted: reports')
}
