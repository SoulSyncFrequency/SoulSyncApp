import { z } from 'zod'
export const TherapyQuerySchema = z.object({
  userId: z.string().uuid().optional()
})
