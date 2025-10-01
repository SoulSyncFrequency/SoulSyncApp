import { Pool } from 'pg'
const sql = `create table if not exists entitlements(
  user_id text primary key,
  active boolean not null default false,
  free_credits int not null default 1,
  updated_at timestamptz not null default now()
);`
async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  await pool.query(sql); console.log('[migrate] entitlements ensured'); process.exit(0)
}
main().catch(e => { console.error(e); process.exit(1) })
