import { z } from 'zod'

export const SuggestionOp = z.enum(['set','unset'])
export const SuggestionSchema = z.object({
  path: z.string().min(1),
  value: z.any().optional(),
  op: SuggestionOp.optional(),
  score: z.number().min(0).max(1).optional()
})

export const SuggestionsApplySchema = z.object({
  collection: z.string().default('generic').optional(),
  id: z.string().default('temp').optional(),
  document: z.record(z.any()),
  suggestions: z.array(SuggestionSchema),
  autoTune: z.boolean().default(false).optional(),
  dryRun: z.boolean().default(false).optional()
})

export type SuggestionsApply = z.infer<typeof SuggestionsApplySchema>
