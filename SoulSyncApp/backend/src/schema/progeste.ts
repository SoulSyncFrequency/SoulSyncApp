
import { z } from 'zod'
export const ProgestEConsent = z.object({ accept: z.literal(true), acceptedAt: z.string().datetime().optional() })
export const ProgestEPlanCreate = z.object({
  doseUnit: z.enum(['drop','mg']).default('drop'),
  mgPerDrop: z.number().positive().nullable().default(null),
  route: z.enum(['topical','oral']).default('topical'),
  schedule: z.any().optional(),
  notes: z.string().max(2000).optional()
})
export const ProgestEDoseLog = z.object({
  planId: z.string().min(1),
  ts: z.string().datetime(),
  amount: z.number().positive(),
  unit: z.enum(['drop','mg']),
  route: z.enum(['topical','oral']),
  note: z.string().max(2000).optional(),
  symptoms: z.object({
    mood: z.number().min(1).max(5).optional(),
    sleep: z.number().min(1).max(5).optional(),
    anxiety: z.number().min(1).max(5).optional(),
    cramps: z.number().min(1).max(5).optional(),
    other: z.string().max(500).optional()
  }).optional()
})
export const ProgestEQueryRange = z.object({ from: z.string().datetime().optional(), to: z.string().datetime().optional() })
