import client from 'prom-client'

export const eventLoopDelayGauge = new client.Gauge({ name: 'process_event_loop_delay_ms', help: 'Event loop lag (ms)' })
export const rssGauge = new client.Gauge({ name: 'process_rss_bytes', help: 'Resident set size in bytes' })
export const heapUsedGauge = new client.Gauge({ name: 'process_heap_used_bytes', help: 'Heap used in bytes' })
export const extMemGauge = new client.Gauge({ name: 'process_external_memory_bytes', help: 'External memory in bytes' })

let last = Date.now()
let lastLag = 0
setInterval(()=>{
  const now = Date.now()
  const lag = Math.max(0, now - last - 1000)
  last = now
  lastLag = lag
  eventLoopDelayGauge.set(lag)
  const mem = process.memoryUsage()
  rssGauge.set(mem.rss)
  heapUsedGauge.set(mem.heapUsed)
  // @ts-ignore
  extMemGauge.set(mem.external || 0)
}, 1000).unref()

export function getLivez() {
  return {
    live: true,
    pid: process.pid,
    eventLoopDelayMs: lastLag
  }
}
