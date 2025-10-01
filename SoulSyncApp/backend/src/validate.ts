import { z } from 'zod'

export const therapyInputSchema = z.object({
  disease: z.string().min(2).max(100),
  symptoms: z.array(z.string()).optional(),
  language: z.enum(['en','hr']).default('en')
})

export type TherapyInputValidated = z.infer<typeof therapyInputSchema>
