
import { Router } from 'express'

const router = Router()
router.get('/ops/process-stats', (_req, res) => {
  const mu = process.memoryUsage()
  const cpu = process.cpuUsage()
  res.json({
    ok:true,
    pid: process.pid,
    node: process.version,
    platform: process.platform,
    uptimeSec: Math.round(process.uptime()),
    memory: { rss: mu.rss, heapTotal: mu.heapTotal, heapUsed: mu.heapUsed, external: (mu as any).external },
    cpu: { userMicros: cpu.user, systemMicros: cpu.system }
  })
})
export default router
