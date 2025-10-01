import { z } from 'zod'
export const ReportsDailySendNowSchema = z.object({
  date: z.string().datetime().optional(),
  force: z.boolean().optional()
})
