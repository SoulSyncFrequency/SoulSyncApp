import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export function requireAuth(req: Request, res: Response, next: NextFunction){
  const h = req.headers['authorization'] || ''
  const token = (h.startsWith('Bearer ') ? h.slice(7) : null) || (req as any).accessToken || null
  if (!token) return res.status(401).json({ error: { code: 'unauthorized' } })
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string)
    ;(req as any).user = payload
    next()
  } catch (e:any){
    return res.status(401).json({ error: { code:'invalid_token', message: e?.message } })
  }
}
