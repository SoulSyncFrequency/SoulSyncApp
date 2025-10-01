
import type { Request, Response, NextFunction } from 'express'

export function responseTime(){
  return (_req:Request, res:Response, next:NextFunction)=>{
    const start = process.hrtime.bigint()
    res.on('finish', ()=>{
      try{
        const ms = Number(process.hrtime.bigint() - start)/1e6
        res.setHeader('X-Response-Time', Math.round(ms).toString() + 'ms')
      }catch{}
    })
    next()
  }
}
