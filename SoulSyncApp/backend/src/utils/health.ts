import type { Pool } from 'pg'
import type { Redis } from 'ioredis'

let pgPool: Pool | null = null
let redis: Redis | null = null

async function getPg(){
  if (pgPool) return pgPool
  const url = process.env.POSTGRES_URL
  if (!url) return null
  const { Pool } = await import('pg')
  pgPool = new Pool({ connectionString: url, max: 2, connectionTimeoutMillis: 2000 })
  return pgPool
}

async function getRedis(){
  if (redis) return redis
  const url = process.env.REDIS_URL
  if (!url) return null
  const Redis = (await import('ioredis')).default
  redis = new Redis(url, { lazyConnect: true, connectTimeout: 1500, maxRetriesPerRequest: 1 })
  return redis
}

export async function checkDb(): Promise<'ok'|'fail'|'unknown'>{
  try {
    const pg = await getPg()
    if (!pg) return 'unknown'
    const { rows } = await pg.query('SELECT 1 as ok')
    return rows && rows[0] && rows[0].ok === 1 ? 'ok' : 'fail'
  } catch { return 'fail' }
}
export async function checkRedis(): Promise<'ok'|'fail'|'unknown'>{
  try {
    const r = await getRedis()
    if (!r) return 'unknown'
    await r.ping()
    return 'ok'
  } catch { return 'fail' }
}
