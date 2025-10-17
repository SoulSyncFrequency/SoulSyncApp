import { z } from 'zod'
export const ExportPdfQuerySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime()
})
