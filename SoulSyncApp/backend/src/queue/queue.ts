import { logger } from '../logger'
import { Queue } from 'bullmq'
import IORedis from 'ioredis'

const REDIS_URL = process.env.REDIS_URL || ''

export let connection: IORedis | null = null
if(REDIS_URL){
  connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null })
  connection.on('error', (e)=> logger.error('[redis] error', e?.message))
}

export const hasQueue = !!connection

export const webhookQueue = connection ? new Queue('webhookQueue', { connection }) : null
export const emailQueue   = connection ? new Queue('emailQueue',   { connection }) : null

export { addIdempotent } from './utils'
