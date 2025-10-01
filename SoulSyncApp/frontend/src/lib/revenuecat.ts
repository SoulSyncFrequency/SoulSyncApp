export async function tryPurchaseViaRevenueCat(): Promise<{ active: boolean } | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const RC = (window as any).RevenueCat
  if (!RC || typeof RC.purchase !== 'function') return null
  try {
    const result = await RC.purchase({ offering: 'default' })
    if (result?.active) return { active: true }
    return { active: false }
  } catch {
    return { active: false }
  }
}
