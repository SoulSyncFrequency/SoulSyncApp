import { NextFunction, Request, Response } from 'express'
import { AnyZodObject } from 'zod'
import { logger } from '../logger'

export function validateRequest(schema: AnyZodObject) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) {
      logger.warn({ issues: parsed.error.issues }, 'Request validation failed')
      return res.status(400).json({ error: 'Invalid request', issues: parsed.error.issues })
    }
    req.body = parsed.data
    next()
  }
}
