import type { Request, Response, NextFunction } from 'express'

type Job = { req: Request; res: Response; next: NextFunction }

const ENABLED = process.env.ENABLE_JOB_QUEUE === 'true'
const CONCURRENCY = Math.max(1, Number(process.env.JOB_QUEUE_CONCURRENCY || 2))
const LIMIT = Math.max(1, Number(process.env.JOB_QUEUE_LIMIT || 50))

const queue: Job[] = []
let running = 0

function isHeavy(req: Request): boolean {
  if (!ENABLED) return false
  // Heuristics: header or path matches heavy patterns
  const h = (req.headers['x-job-queue'] || '').toString().toLowerCase()
  if (h === 'heavy') return true
  const p = req.path.toLowerCase()
  return /(generate|process|therapy|analysis|report)/.test(p) && req.method !== 'GET'
}

function pump() {
  while (running < CONCURRENCY && queue.length > 0) {
    const job = queue.shift()!
    running++
    // Run request
    try {
      job.next()
    } catch (e) {
      job.res.status(500).json({ message: 'Job execution error' })
      running--
      continue
    }
    // Decrement on finish
    job.res.on('finish', () => {
      running = Math.max(0, running - 1)
      setImmediate(pump)
    })
  }
}

export function jobQueue(req: Request, res: Response, next: NextFunction) {
  if (!isHeavy(req)) return next()
  if (queue.length >= LIMIT) {
    return res.status(429).json({ message: 'Queue is full, please retry later' })
  }
  // Inform client about position (best-effort)
  const position = queue.length + 1
  res.setHeader('X-Queue-Position', String(position))
  // Enqueue and pump
  queue.push({ req, res, next })
  res.statusCode = 202 // mark as accepted until actually processed
  setImmediate(pump)
}
