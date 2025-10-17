import { NextFunction, Request, Response } from 'express'
import { ZodSchema } from 'zod'
import { LoginResponseSchema } from '../schemas/auth'
import { TherapyResponseSchema } from '../schemas/therapy'
import { logger } from '../logger'

// Hardcoded map for quick wins
const map: Record<string, ZodSchema | undefined> = {
  '/api/auth/login': LoginResponseSchema,
  '/api/therapy/generate': TherapyResponseSchema,
}

// Global middleware: dev/test = fail, prod = warn
export function responseValidator(req: Request, res: Response, next: NextFunction) {
  const orig = res.json.bind(res)
  res.json = (body: unknown) => {
    const schema = map[req.path]
    if (schema) {
      const parsed = schema.safeParse(body)
      if (!parsed.success) {
        if (process.env.NODE_ENV === 'production') {
          logger.warn({ issues: parsed.error.issues, path: req.path }, 'Response schema mismatch')
        } else {
          logger.error({ issues: parsed.error.issues, path: req.path }, 'Response schema mismatch')
          return res.status(500).json({ error: 'Response schema mismatch', issues: parsed.error.issues })
        }
      }
    }
    return orig(body)
  }
  next()
}

// Helper: mount directly on routes
export function validateResponse(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const orig = res.json.bind(res)
    res.json = (body: unknown) => {
      const parsed = schema.safeParse(body)
      if (!parsed.success) {
        if (process.env.NODE_ENV === 'production') {
          logger.warn({ issues: parsed.error.issues }, 'Response schema mismatch')
        } else {
          logger.error({ issues: parsed.error.issues }, 'Response schema mismatch')
          return res.status(500).json({ error: 'Response schema mismatch', issues: parsed.error.issues })
        }
      }
      return orig(body)
    }
    next()
  }
}
