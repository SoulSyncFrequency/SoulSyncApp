import { Request, Response, NextFunction } from 'express'

export function requireAdmin(req: Request, res: Response, next: NextFunction){
  const token = (req.headers.authorization||'').split(' ')[1]
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'dev-token'
  if(!token || token!==ADMIN_TOKEN){
    return res.status(401).json({ ok:false, error:'unauthorized' })
  }
  next()
}
