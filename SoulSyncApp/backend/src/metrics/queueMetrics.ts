import { Counter, Gauge, Histogram } from 'prom-client'
import { webhookQueue, emailQueue, hasQueue } from '../queue/queue'
import { Queue, QueueEvents } from 'bullmq'

const jobsCurrent = new Gauge({ name: 'queue_jobs_current', help: 'Current jobs by state', labelNames: ['queue','state'] as const })
const jobsCompleted = new Counter({ name: 'queue_jobs_completed_total', help: 'Total completed jobs', labelNames: ['queue'] as const })
const jobsFailed = new Counter({ name: 'queue_jobs_failed_total', help: 'Total failed jobs', labelNames: ['queue'] as const })
const jobDuration = new Histogram({ name: 'queue_job_duration_seconds', help: 'Job processing time in seconds', buckets: [0.1,0.5,1,2,5,10,30,60], labelNames: ['queue'] as const })

let initialized = false

async function sampleQueueDepth(q: Queue, name: string){
  try{
    const multi = await Promise.all([q.getWaitingCount(), q.getActiveCount(), q.getDelayedCount(), q.getFailedCount(), q.getPausedCount()])
    const [waiting, active, delayed, failed, paused] = multi
    jobsCurrent.labels(name,'waiting').set(waiting)
    jobsCurrent.labels(name,'active').set(active)
    jobsCurrent.labels(name,'delayed').set(delayed)
    jobsCurrent.labels(name,'failed').set(failed)
    jobsCurrent.labels(name,'paused').set(paused)
  }catch{}
}

export function initQueueMetrics(){
  if (initialized) return
  if (!hasQueue) { initialized = true; return }
  const queues = [{ name:'webhookQueue', q: webhookQueue! }, { name:'emailQueue', q: emailQueue! }]
  setInterval(()=> queues.forEach(({q,name})=> sampleQueueDepth(q,name)), 5000).unref()

  for(const {name, q} of queues){
    const events = new QueueEvents(name, { connection: (q as any).opts.connection })
    events.on('completed', async ({ jobId }: any) => {
      jobsCompleted.labels(name).inc()
      try {
        const job: any = await q.getJob(jobId as any)
        const dur = job?.finishedOn && job?.processedOn ? (job.finishedOn - job.processedOn)/1000 : null
        if (dur) jobDuration.labels(name).observe(dur)
      } catch {}
    })
    events.on('failed', async () => jobsFailed.labels(name).inc())
  }
  initialized = true
}
