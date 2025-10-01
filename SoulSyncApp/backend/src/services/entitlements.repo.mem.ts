const store = new Map<string, { active: boolean; freeCredits: number }>()

export async function ensureSchema() { /* noop */ }
export async function get(userId: string) {
  if (!store.has(userId)) store.set(userId, { active: false, freeCredits: 1 })
  return store.get(userId)!
}
export async function setActive(userId: string, active: boolean) {
  const e = await get(userId); e.active = active; store.set(userId, e)
}
export async function decFreeCredit(userId: string) {
  const e = await get(userId); if (e.freeCredits > 0) e.freeCredits -= 1; store.set(userId, e)
}
