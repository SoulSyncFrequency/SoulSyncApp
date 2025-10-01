import { NextFunction, Request, Response } from 'express'

export function cacheControl(req: Request, res: Response, next: NextFunction) {
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store')
  }
  next()
}
