import { z } from 'zod'
export const TherapyGenerateSchema = z.object({
  userId: z.string().uuid(),
  options: z.record(z.any()).optional()
})
