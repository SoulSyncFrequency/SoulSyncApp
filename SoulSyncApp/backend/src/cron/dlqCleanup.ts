import { Queue } from 'bullmq'
import IORedis from 'ioredis'

const REDIS_URL = process.env.REDIS_URL || ''
const TTL_DAYS = Number(process.env.DLQ_TTL_DAYS || 7)

export function startDlqCleanup(){
  if(!REDIS_URL) return
  const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null })
  const queues = ['webhookQueue','emailQueue']
  const grace = TTL_DAYS * 24 * 60 * 60 * 1000 // ms

  async function cleanOne(name: string){
    const q = new Queue(name+':dlq', { connection })
    try{
      // Clean all states older than grace
      await Promise.all([
        q.clean(grace, 1000, 'wait'),
        q.clean(grace, 1000, 'delayed'),
        q.clean(grace, 1000, 'failed'),
        q.clean(grace, 1000, 'completed')
      ])
    }catch{}
  }

  const loop = async ()=> {
    for(const n of queues) await cleanOne(n)
  }
  // every 6h
  setInterval(loop, 6*60*60*1000).unref()
  loop()
}
