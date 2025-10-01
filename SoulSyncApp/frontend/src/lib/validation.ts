import { z } from 'zod'

export const logsFilterSchema = z.object({
  level: z.enum(['','INFO','WARN','ERROR']).default(''),
  q: z.string().max(200).default(''),
  since: z.string().optional().default(''),
  until: z.string().optional().default('')
})

export type LogsFilter = z.infer<typeof logsFilterSchema>
