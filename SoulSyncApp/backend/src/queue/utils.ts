import crypto from 'crypto'
import { Queue, JobsOptions } from 'bullmq'

export function deterministicJobId(kind: string, payload: any){
  const hash = crypto.createHash('sha1').update(kind + '|' + JSON.stringify(payload||{})).digest('hex')
  return `${kind}:${hash}`
}

export async function addIdempotent(queue: Queue, kind: string, payload: any, opts: JobsOptions = {}){
  const jobId = opts.jobId || deterministicJobId(kind, payload)
  return queue.add(kind, payload, { ...opts, jobId, removeOnComplete: 500, removeOnFail: 500 })
}
