import { Request, Response, NextFunction } from 'express'

export function adminGuard(req: Request, res: Response, next: NextFunction){
  // Strategy 1: user object with role injected by your auth layer
  const anyReq: unknown = req as unknown
  const role = anyReq.user?.role || anyReq.auth?.role

  // Strategy 2: header token fallback
  const token = req.header('x-admin-token')
  const envToken = process.env.ADMIN_API_TOKEN

  if(role === 'ADMIN') return next()
  if(envToken && token === envToken) return next()

  return res.status(403).json({ error: 'admin_only' })
}
