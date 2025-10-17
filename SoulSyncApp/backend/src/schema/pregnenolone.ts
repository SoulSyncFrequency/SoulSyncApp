
import { z } from 'zod'

export const PregnenoloneConsent = z.object({ accept: z.literal(true), acceptedAt: z.string().datetime().optional() })

export const PregnenolonePlanCreate = z.object({
  doseUnit: z.enum(['mg','drop']).default('mg'),
  mgPerDrop: z.number().positive().nullable().default(null),
  route: z.enum(['oral','topical']).default('oral'),
  schedule: z.any().optional(),
  notes: z.string().max(2000).optional()
})

export const PregnenoloneDoseLog = z.object({
  planId: z.string().min(1),
  ts: z.string().datetime(),
  amount: z.number().positive(),
  unit: z.enum(['mg','drop']),
  route: z.enum(['oral','topical']),
  note: z.string().max(2000).optional(),
  symptoms: z.object({
    mood: z.number().min(1).max(5).optional(),
    focus: z.number().min(1).max(5).optional(),
    anxiety: z.number().min(1).max(5).optional(),
    energy: z.number().min(1).max(5).optional(),
    sleep: z.number().min(1).max(5).optional(),
    other: z.string().max(500).optional()
  }).optional()
})

export const PregnenoloneQueryRange = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional()
})
