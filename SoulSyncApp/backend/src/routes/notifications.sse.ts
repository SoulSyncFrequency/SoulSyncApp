import { Router } from 'express'

type Client = { id:number; res: unknown }
let clients: Client[] = []
let counter = 0

export function broadcastNotification(evt: unknown){
  const data = `data: ${JSON.stringify(evt)}\n\n`
  for(const c of clients){
    try { c.res.write(data) } catch {}
  }
}

const router = Router()

router.get('/stream', (req,res)=>{
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  })
  res.flushHeaders?.()
  res.write('retry: 10000\n\n') // 10s reconnection hint
  const id = ++counter
  clients.push({ id, res })
  req.on('close', ()=>{
    clients = clients.filter(c=>c.id!==id)
  })
})

export default router