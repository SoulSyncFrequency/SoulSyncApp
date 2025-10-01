import type { Config } from 'drizzle-kit'

export default {
  schema: './src/../drizzle/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  verbose: true,
  strict: true
} satisfies Config
