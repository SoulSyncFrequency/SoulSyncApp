
// Added stricter validators for critical GET routes
import { z } from "zod";

export const AdminDashboardExportPdfQuerySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime()
});

export const LogsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional()
});

export const MetricsQuerySchema2 = z.object({
  range: z.enum(["1h","24h","7d"])
});


// Added stricter validators for GET routes
import { z } from "zod";

export const LogsExportQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional()
});

export const MetricsQuerySchema = z.object({
  range: z.enum(["1h","24h","7d"])
});

export const ReportsHistoryQuerySchema = z.object({
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().nonnegative().optional()
});

import { NextFunction, Request, Response } from 'express'
import { z, ZodSchema } from 'zod'
import { logger } from '../logger'

// Auto-generated mapping of query schemas (start permissive; tighten over time)
const querySchemas: Record<string, ZodSchema<any> | undefined> = {
  '/.well-known/security.txt': z.object({}).passthrough() // TODO tighten,
  '/api/_test-error': z.object({}).passthrough() // TODO tighten,
  '/api/admin/dashboard/export-pdf': AdminDashboardExportPdfQuerySchema,
  '/api/docs': z.object({}).passthrough() // TODO tighten,
  '/api/integrity': z.object({}).passthrough() // TODO tighten,
  '/api/integrity/public-key': z.object({}).passthrough() // TODO tighten,
  '/api/logs': LogsQuerySchema,
  '/api/logs/export.csv': LogsQuerySchema,
  '/api/metrics': MetricsQuerySchema2,
  '/api/openapi.yaml': z.object({}).passthrough() // TODO tighten,
  '/api/status': z.object({}).passthrough() // TODO tighten,
  '/healthz': z.object({}).passthrough() // TODO tighten,
  '/robots.txt': z.object({}).passthrough() // TODO tighten
}

export function queryValidator(req: Request, res: Response, next: NextFunction) {
  if (req.method.toUpperCase() !== 'GET') return next()
  const schema = querySchemas[req.path]
  if (schema) {
    const parsed = schema.safeParse(req.query)
    if (!parsed.success) {
      if (process.env.NODE_ENV === 'production') {
        logger.warn({ issues: parsed.error.issues, path: req.path }, 'Query schema mismatch')
      } else {
        logger.error({ issues: parsed.error.issues, path: req.path }, 'Query schema mismatch')
        return res.status(400).json({ error: 'Invalid query', issues: parsed.error.issues })
      }
    } else {
      req.query = parsed.data as unknown
    }
  }
  next()
}