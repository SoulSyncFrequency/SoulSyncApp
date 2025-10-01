
import type { Request, Response, NextFunction } from 'express'

export function errorHandler(){
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = Number(err?.status || err?.statusCode || 500)
    const body = {
      error: err?.code || err?.name || 'internal_error',
      details: process.env.NODE_ENV === 'production' ? undefined : (err?.message || err)
    }
    res.status(status).json(body)
  }
}
