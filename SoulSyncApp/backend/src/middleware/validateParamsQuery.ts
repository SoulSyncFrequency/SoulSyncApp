import { NextFunction, Request, Response } from 'express'
import { AnyZodObject } from 'zod'
import { logger } from '../logger'

export function validateParams(schema: AnyZodObject) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.params)
    if (!parsed.success) {
      logger.warn({ issues: parsed.error.issues }, 'Params validation failed')
      return res.status(400).json({ error: 'Invalid params', issues: parsed.error.issues })
    }
    req.params = parsed.data
    next()
  }
}

export function validateQuery(schema: AnyZodObject) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.query)
    if (!parsed.success) {
      logger.warn({ issues: parsed.error.issues }, 'Query validation failed')
      return res.status(400).json({ error: 'Invalid query', issues: parsed.error.issues })
    }
    req.query = parsed.data
    next()
  }
}
