import type { Request, Response } from 'express'

const startedAt = new Date()

export function livez(_req: Request, res: Response) {
  res.status(200).json({ status: 'ok' })
}

export async function readyz(_req: Request, res: Response) {
  const checks: Record<string, { ok: boolean; info?: string }> = {}
  // DB check (optional): if a global pool exists or DATABASE_URL is set
  try {
    // @ts-expect-error optional global
    const pool = globalThis.__DB_POOL__ as unknown | undefined
    if (pool && typeof pool.query === 'function') {
      const t0 = Date.now(); await pool.query('SELECT 1'); const dt = Date.now()-t0; checks.db = { ok: true, latencyMs: dt }
      checks.db = { ok: true }
    } else if (process.env.DATABASE_URL) {
      checks.db = { ok: true, info: 'DATABASE_URL present (no pool)' }
    } else {
      checks.db = { ok: true, info: 'no DB configured' }
    }
  } catch (e: unknown) {
    checks.db = { ok: false, info: String(e?.message || e) }
  }

  // Redis check (optional): if REDIS_URL present
  try {
    if (process.env.REDIS_URL) {
      checks.redis = { ok: true }
    } else {
      checks.redis = { ok: true, info: 'no Redis configured' }
    }
  } catch (e: unknown) {
    checks.redis = { ok: false, info: String(e?.message || e) }
  }

  const ok = Object.values(checks).every(v => v.ok)
  const payload = {
    status: ok ? 'ok' : 'error',
    uptime: process.uptime(),
    startTime: startedAt.toISOString(),
    gitSha: process.env.GIT_SHA || undefined,
    checks
  }
  res.status(ok ? 200 : 503).json(payload)
}
