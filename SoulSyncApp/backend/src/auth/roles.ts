import { Request, Response, NextFunction } from 'express'

type Role = 'user' | 'therapist' | 'admin'

export function requireRole(min: Role){
  const order: Record<Role, number> = { user: 1, therapist: 2, admin: 3 }
  return (req: Request, res: Response, next: NextFunction) => {
    const r = (req as any).user?.role as Role | undefined
    if (!r) return res.status(401).json({ error: { code:'unauthorized' } })
    if (order[r] < order[min]) return res.status(403).json({ error:{ code:'forbidden' } })
    next()
  }
}
