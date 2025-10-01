import { requestWithCB } from './lib/httpClient'
/* Real RevenueCat integration (Node 18+: global fetch). */
type RCSubscriber = {
  entitlements?: Record<string, { expires_date?: string | null; product_identifier?: string; purchase_date?: string }>
  subscriptions?: Record<string, any>
}

export async function fetchRevenueCatEntitlements(appUserId: string): Promise<{ active: boolean } | null> {
  const key = process.env.REVENUECAT_SECRET
  if (!key || !appUserId) return null
  const endpoint = process.env.REVENUECAT_API || 'https://api.revenuecat.com/v1/subscribers/' + encodeURIComponent(appUserId)

  // Prefer native fetch (Node 18+). Fallback to node-fetch if needed.
  // @ts-ignore
  const _fetch: typeof fetch = (typeof fetch !== 'undefined') ? fetch : (await import('node-fetch')).default as unknown

  const res = await _requestWithCB(endpoint, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Accept': 'application/json'
    }
  })
  if (!res.ok) {
    // 404 -> not found / no purchases -> return { active: false }
    if (res.status === 404) return { active: false }
    const text = await res.text().catch(()=> '')
    throw new Error(`RevenueCat HTTP ${res.status}: ${text}`)
  }
  const json = await res.json() as { subscriber?: RCSubscriber }
  const ents = json?.subscriber?.entitlements || {}
  // Consider any entitlement without past expiry as active
  const now = Date.now()
  const active = Object.values(ents).some(e => {
    if (!e) return false
    if (!e.expires_date) return true // lifetime / non-expiring
    const t = Date.parse(e.expires_date)
    return !Number.isNaN(t) && t > now
  })
  return { active }
}
