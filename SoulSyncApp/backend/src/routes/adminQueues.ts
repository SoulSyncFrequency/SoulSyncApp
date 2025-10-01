import { Router } from 'express'
import { bindQueueMetrics } from '../metrics/queues'
import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { ExpressAdapter } from '@bull-board/express'
import { therapyQueue, smilesQueue, f0Queue } from '../jobs/queue'
import { requireRole as requireAdminToken } from '../middleware/rbac'

const r = Router()

function basicAuth(req: any, res: any, next: any){
  const user = process.env.ADMIN_UI_USER || ''
  const pass = process.env.ADMIN_UI_PASS || ''
  if(!user || !pass) return next()
  const h = req.headers['authorization'] || ''
  if(!h.startsWith('Basic ')) return res.status(401).set('WWW-Authenticate','Basic realm="Queues"').end('Auth required')
  const [u,p] = Buffer.from(h.split(' ')[1], 'base64').toString().split(':')
  if(u===user && p===pass):
    return next()
  return res.status(401).end('Invalid credentials')
}

const serverAdapter = new ExpressAdapter()
serverAdapter.setBasePath('/admin/queues')
// Bind Prometheus queue metrics
bindQueueMetrics({ therapy: therapyQueue, smiles: smilesQueue, f0: f0Queue })


createBullBoard({
  queues: [new BullMQAdapter(therapyQueue), new BullMQAdapter(smilesQueue), new BullMQAdapter(f0Queue)],
  serverAdapter
})

r.use('/admin/queues', requireAdminToken('admin'), basicAuth, serverAdapter.getRouter())

export default r


// Read-only UI for ops role
import { ExpressAdapter as OpsAdapter } from '@bull-board/express'
const opsAdapter = new OpsAdapter()
opsAdapter.setBasePath('/ops/queues')
createBullBoard({
  queues: [new BullMQAdapter(therapyQueue), new BullMQAdapter(smilesQueue), new BullMQAdapter(f0Queue)],
  serverAdapter: opsAdapter
})
function opsReadOnly(req: any, res: any, next: any){ if(req.method && req.method !== 'GET'){ return res.status(405).end('Read-only') } next() }
r.use('/ops/queues', requireAdminToken('therapist'), opsReadOnly, opsAdapter.getRouter())
