
// Added stricter validators for critical POST routes
import { z } from "zod";

export const ReportsDailySendNowRequestSchema = z.object({
  force: z.boolean().optional()
});

export const WebhookTestRequestSchema = z.object({
  payload: z.record(z.any())
});

import { NextFunction, Request, Response } from 'express'
import { z, ZodSchema } from 'zod'
import { logger } from '../logger'

// Auto-generated mapping of request schemas (start permissive; tighten over time)
const reqSchemas: Record<string, ZodSchema<any> | undefined> = {
  '/api/reports/daily/send-now': z.object({}).passthrough() // TODO: tighten schema,
  '/api/webhooks/:id/test': z.object({}).passthrough() // TODO: tighten schema
}

export function requestValidator(req: Request, res: Response, next: NextFunction) {
  const schema = reqSchemas[req.path]
  if (schema) {
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) {
      if (process.env.NODE_ENV === 'production') {
        logger.warn({ issues: parsed.error.issues, path: req.path }, 'Request schema mismatch')
      } else {
        logger.error({ issues: parsed.error.issues, path: req.path }, 'Request schema mismatch')
        return res.status(400).json({ error: 'Invalid request', issues: parsed.error.issues })
      }
    } else {
      req.body = parsed.data
    }
  }
  next()
}
