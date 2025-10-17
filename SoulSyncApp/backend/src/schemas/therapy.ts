import { z } from 'zod'

export const TherapyResponseSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  pdfUrl: z.string().url()
})


export const TherapyRequestSchema = z.object({
  userId: z.string().min(1),
  options: z.record(z.any()).optional()
})
