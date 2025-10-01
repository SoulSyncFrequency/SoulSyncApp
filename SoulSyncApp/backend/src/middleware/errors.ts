import { NextFunction, Request, Response } from 'express'
import { logger } from '../logger'

export class AppError extends Error {
  code: string
  httpStatus: number
  details?: any
  constructor(code: string, message: string, httpStatus = 400, details?: any){
    super(message)
    this.code = code
    this.httpStatus = httpStatus
    this.details = details
  }
}

export function notFound(_req: Request, res: Response){
  res.status(404).json({ error: { code: 'not_found', message: 'Not Found' } })
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction){
  if (err instanceof AppError){
    logger.warn({ err: { code: err.code, details: err.details } }, 'AppError')
    return res.status(err.httpStatus).json({ error: { code: err.code, message: err.message } })
  }
  const status = err.status || 500
  const msg = err.message || 'internal_error'
  logger.error({ err, status }, 'Unhandled error')
  res.status(status).json({ error: { code: 'internal_error', message: msg } })
}
