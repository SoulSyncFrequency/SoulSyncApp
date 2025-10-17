import type { Request, Response, NextFunction } from 'express'

export function doubleSubmitCsrf(req: Request, res: Response, next: NextFunction){
  const tokenFromCookie = (req.cookies && req.cookies['csrfToken']) || null
  const tokenFromHeader = (req.headers['x-csrf-token'] as string) || null
  if(!tokenFromCookie || !tokenFromHeader || tokenFromCookie !== tokenFromHeader){
    return res.status(403).json({ error: { code:'csrf_failed' } })
  }
  next()
}
