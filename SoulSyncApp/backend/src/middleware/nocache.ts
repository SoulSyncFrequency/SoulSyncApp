
import type { Request, Response, NextFunction } from 'express'
export function noCache(){
  return (_req:Request, res:Response, next:NextFunction)=>{
    res.setHeader('Cache-Control','no-store, no-cache, must-revalidate, proxy-revalidate')
    res.setHeader('Pragma','no-cache')
    res.setHeader('Expires','0')
    next()
  }
}
