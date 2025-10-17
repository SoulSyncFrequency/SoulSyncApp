import { Pool } from 'pg'
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
export async function ensureSchema() {
  await pool.query(`create table if not exists entitlements(
    user_id text primary key,
    active boolean not null default false,
    free_credits int not null default 1,
    updated_at timestamptz not null default now()
  );`)
}
export async function get(userId: string) {
  const r = await pool.query('select active, free_credits from entitlements where user_id=$1', [userId])
  if (r.rowCount === 0) {
    await pool.query('insert into entitlements(user_id,active,free_credits) values($1,false,1)', [userId])
    return { active: false, freeCredits: 1 }
  }
  const row = r.rows[0]
  return { active: !!row.active, freeCredits: Number(row.free_credits) }
}
export async function setActive(userId: string, active: boolean) {
  await pool.query('insert into entitlements(user_id,active,free_credits) values($1,$2,1) on conflict(user_id) do update set active=$2, updated_at=now()', [userId, active])
}
export async function decFreeCredit(userId: string) {
  await pool.query('update entitlements set free_credits = greatest(free_credits-1,0), updated_at=now() where user_id=$1', [userId])
}
