import { z } from 'zod'

const Bool = z.preprocess(v => {
  const s = String(v || '').toLowerCase()
  return ['1','true','yes','on','y'].includes(s)
}, z.boolean())

const FlagsSchema = z.object({
  FALLBACK_PDF_ENGINE: Bool.default(false),
  EXPERIMENTAL_NEW_FLOW: Bool.default(false),
})

export type FeatureFlags = z.infer<typeof FlagsSchema>

export function loadFlags(env = process.env): FeatureFlags {
  return FlagsSchema.parse({
    FALLBACK_PDF_ENGINE: env.FALLBACK_PDF_ENGINE,
    EXPERIMENTAL_NEW_FLOW: env.EXPERIMENTAL_NEW_FLOW,
  })
}
