// src/realtime/progress.ts
import type { Application } from 'express'
import type { Server } from 'http'
import { EventEmitter } from 'events'
let nextId = 1

const events = new EventEmitter()
type Progress = { id:string, progress:number, detail?:string }

let wsReady = false
export function emitProgress(p: Progress){
  events.emit(p.id, p)
  if(wsReady && (global as any).__soul_io){
    try { (global as any).__soul_io.to(p.id).emit('progress', p) } catch {}
  }
}

export function initRealtime(app: Application, server: Server){
  // Try WebSocket via socket.io if available
  try{
    const { Server: IOServer } = require('socket.io')
    const io = new IOServer(server, { cors:{ origin:'*' } })
    ;(global as any).__soul_io = io
    wsReady = true
  } catch { wsReady = false }

  // SSE endpoint
  app.get('/api/admin/export/:id/stream', (req,res)=>{
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders?.()
    const id = String(req.params.id)
    const listener = (p:Progress)=> { const id = nextId++; res.write(`id: ${id}\nevent: progress\ndata: ${JSON.stringify(p)}\n\n`) }
    events.on(id, listener)
    const ka = setInterval(()=>{ try{ res.write(': keepalive\n\n') }catch{} }, 15000)
    req.on('close', ()=> { clearInterval(ka); events.off(id, listener) })
  })

  // Manual progress update (also usable by jobs)
  app.post('/api/admin/export/:id/progress', (req,res)=>{
    const id = String(req.params.id)
    const progress = Number(req.body?.progress || 0)
    const detail = req.body?.detail
    emitProgress({ id, progress, detail })
    res.json({ ok:true })
  })
}
