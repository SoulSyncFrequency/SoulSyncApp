
import type { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'

export function requestId(){
  return (req:Request, res:Response, next:NextFunction)=>{
    const incoming = String(req.headers['x-request-id']||'').trim()
    const rid = incoming || crypto.randomUUID?.() || crypto.randomBytes(16).toString('hex')
    ;(req as any).requestId = rid
    res.locals.requestId = rid
    res.setHeader('X-Request-Id', rid)
    next()
  }
}
