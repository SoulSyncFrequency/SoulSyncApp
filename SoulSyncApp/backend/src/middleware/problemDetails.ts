import { NextFunction, Request, Response } from 'express'

export function problemDetails(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const status = typeof err?.status === 'number' ? err.status : 500
  const title = err?.title || (status >= 500 ? 'Internal Server Error' : 'Bad Request')
  const detail = err?.message || err?.detail
  const type = err?.type || 'about:blank'
  const instance = err?.instance

  res.status(status).json({
    type, title, status, detail, instance
  })
}
