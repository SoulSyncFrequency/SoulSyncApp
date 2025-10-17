import { z } from 'zod'
const clamp01 = (n:number)=> Math.max(0, Math.min(1, n))

export const F0DiseaseType = z.enum(['neurodegenerative','autoimmune','oncological','psychological'])
export const F0InputSchema = z.object({
  Sym: z.number().min(0).max(1).min(0).max(1),
  Pol: z.number().min(0).max(1).min(0).max(1),
  Bph: z.number().min(0).max(1).min(0).max(1),
  Emo: z.number().min(0).max(1).min(0).max(1),
  Coh: z.number().min(0).max(1).min(0).max(1),
  Frac: z.number().min(0).max(1).min(0).max(1),
  Conn: z.number().min(0).max(1).min(0).max(1),
  Chak: z.number().min(0).max(1).min(0).max(1),
  Info: z.number().min(0).max(1).min(0).max(1),
  Safe: z.number().min(0).max(1).min(0).max(1),
  disease_type: F0DiseaseType
})

export type F0Input = z.infer<typeof F0InputSchema>
