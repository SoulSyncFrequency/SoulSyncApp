import { z } from 'zod'

export const logsQuerySchema = z.object({
  level: z.enum(['INFO','WARN','ERROR']).optional().or(z.literal('')).optional(),
  q: z.string().max(200).optional().or(z.literal('')).optional(),
  since: z.string().datetime().optional().or(z.literal('')).optional(),
  until: z.string().datetime().optional().or(z.literal('')).optional(),
})
