
import type { Request, Response, NextFunction } from 'express'

export function requestTimeout(){
  return (req:Request, res:Response, next:NextFunction)=>{
    const ms = Number(process.env.REQUEST_TIMEOUT_MS||'30000')
    const t = setTimeout(()=>{
      if (!res.headersSent){
        res.status(503).json({ error:'timeout', message:`Request timed out after ${ms}ms` })
      }
      try{ (res as any).end() }catch{}
    }, ms)
    res.on('finish', ()=>clearTimeout(t))
    res.on('close', ()=>clearTimeout(t))
    next()
  }
}
