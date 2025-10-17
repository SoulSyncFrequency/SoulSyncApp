import { Gauge, register } from 'prom-client'
import type { Queue } from 'bullmq'

const waitingGauge = new Gauge({ name: 'bull_queue_waiting_jobs', help: 'Number of waiting jobs', labelNames: ['queue'] })
const activeGauge = new Gauge({ name: 'bull_queue_active_jobs', help: 'Number of active jobs', labelNames: ['queue'] })
const delayedGauge = new Gauge({ name: 'bull_queue_delayed_jobs', help: 'Number of delayed jobs', labelNames: ['queue'] })
const failedGauge = new Gauge({ name: 'bull_queue_failed_jobs', help: 'Number of failed jobs', labelNames: ['queue'] })
const completedGauge = new Gauge({ name: 'bull_queue_completed_jobs', help: 'Number of completed jobs (lifetime counter may reset on restart)', labelNames: ['queue'] })

export function bindQueueMetrics(queues: Record<string, Queue>, intervalMs = 10000){
  async function poll(){
    for (const [name, q] of Object.entries(queues)){
      try {
        const c = await (q as any).getJobCounts()
        waitingGauge.labels(name).set(c.waiting || 0)
        activeGauge.labels(name).set(c.active || 0)
        delayedGauge.labels(name).set(c.delayed || 0)
        failedGauge.labels(name).set(c.failed || 0)
        completedGauge.labels(name).set(c.completed || 0)
      } catch {}
    }
  }
  // initial poll and set interval
  poll().catch(()=>{})
  setInterval(poll, intervalMs).unref()
}
