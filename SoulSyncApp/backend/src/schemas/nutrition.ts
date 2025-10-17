import { z } from 'zod'

export const NutritionPlanSchema = z.object({
  days: z.array(z.object({
    day: z.number(),
    meals: z.array(z.string())
  }))
})
