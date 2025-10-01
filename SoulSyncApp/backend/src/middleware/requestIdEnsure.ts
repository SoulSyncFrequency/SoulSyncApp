import type { Request, Response, NextFunction } from 'express'
import { randomUUID } from 'crypto'

export function requestIdEnsure(req: Request, res: Response, next: NextFunction){
  const existing = (req.headers['x-request-id'] as string) || null
  const id = existing || randomUUID()
  res.setHeader('x-request-id', id)
  ;(req as any).requestId = id
  next()
}
