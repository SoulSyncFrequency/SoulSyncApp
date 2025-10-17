import { Queue } from 'bullmq'
import { env } from '../config'
import IORedis from 'ioredis'

const connection = env.REDIS_URL ? new IORedis(env.REDIS_URL) : undefined

export const therapyQueue = new Queue('therapy-generation', { connection })
export const smilesQueue  = new Queue('smiles-gen', { connection })
export const f0Queue      = new Queue('f0-score', { connection })
