import { Worker, Job } from 'bullmq'
import { env } from '../config'
import IORedis from 'ioredis'

const connection = env.REDIS_URL ? new IORedis(env.REDIS_URL) : undefined

async function handleTherapy(job: Job){ /* TODO: implement heavy logic */ return { ok: true } }
async function handleSmiles(job: Job){ /* TODO */ return { ok: true } }
async function handleF0(job: Job){ /* TODO */ return { ok: true } }

new Worker('therapy-generation', handleTherapy, { connection })
new Worker('smiles-gen', handleSmiles, { connection })
new Worker('f0-score', handleF0, { connection })

console.log('Workers started')
