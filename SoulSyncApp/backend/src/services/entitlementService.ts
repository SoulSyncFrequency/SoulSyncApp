const MODE = (process.env.ENTITLEMENTS_REPO || 'pg').toLowerCase()
const PLATFORM = (process.env.APP_PLATFORM || 'store').toLowerCase()
let repo: unknown
if (MODE === 'mem') repo = require('./entitlements.repo.mem.ts')
else repo = require('./entitlements.repo.pg.ts')

export async function bootstrapEntitlements() { await repo.ensureSchema?.() }
import { fetchRevenueCatEntitlements } from './revenuecat'
export async function getUserEntitlements(userId: string) {
  const e = await repo.get(userId);
  if (PLATFORM === 'store') {
    try {
      const rc = await fetchRevenueCatEntitlements(userId)
      if (rc && typeof rc.active === 'boolean') {
        // Mirror RC status into local store for consistency
        await repo.setActive?.(userId, rc.active)
        return { active: rc.active, freeCredits: Number(e.freeCredits ?? e.free_credits ?? 0) }
      }
    } catch {}
  }
  return { active: !!e.active, freeCredits: Number(e.freeCredits ?? e.free_credits ?? 0) }
}
export async function setActive(userId: string, active: boolean) { await repo.setActive(userId, active) }
export async function decrementFreeCredit(userId: string) { await repo.decFreeCredit(userId) }
