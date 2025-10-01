
import { z } from 'zod'

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development','test','production']).default('development'),
  PORT: z.string().regex(/^\d+$/).default('3000'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be strong'),
  CORS_ALLOWED_ORIGINS: z.string().min(1),
  REDIS_URL: z.string().url().optional(),
  JSON_BODY_LIMIT: z.string().default('1mb'),
  FORM_BODY_LIMIT: z.string().default('1mb'),
  CSP_REPORT_ONLY: z.string().optional(),
  CSP_DIRECTIVE: z.string().optional(),
  CSP_REPORT_URI: z.string().optional(),
  FORCE_HSTS: z.string().optional(),
  MAINTENANCE_MODE: z.string().optional(),
  F0_SAFE_THRESHOLD: z.string().optional(),
})

export type Env = z.infer<typeof EnvSchema>

export function loadEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env)
  if (!parsed.success){
    const issues = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')
    const msg = `Invalid environment configuration: ${issues}`
    if (process.env.NODE_ENV === 'production'){
      throw new Error(msg)
    } else {
      // eslint-disable-next-line no-console
      console.warn('[ENV WARNING]', msg)
    }
  }
  return (parsed.success ? parsed.data : (process.env as any)) as Env
}
