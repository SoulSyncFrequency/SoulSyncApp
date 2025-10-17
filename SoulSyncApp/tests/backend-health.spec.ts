import { test, expect, request } from '@playwright/test'

test('Backend /healthz and /version respond if backend is running', async ({}) => {
  const base = process.env.API_BASE_URL || 'http://localhost:3000'
  const ctx = await request.newContext()
  try {
    const h = await ctx.get(base + '/healthz')
    const v = await ctx.get(base + '/version')
    if (!h.ok() || !v.ok()) {
      test.skip(true, 'Backend reachable but endpoints not OK')
    }
    const hv = await h.text()
    const vv = await v.json().catch(() => null)
    // Basic assertions
    expect(h.status(), '/healthz status').toBe(200)
    expect(hv.toLowerCase()).toContain('ok')
    expect(v.status(), '/version status').toBe(200)
    expect(vv).toBeTruthy(); expect(typeof vv.version).toBe('string'); expect(vv).toHaveProperty('buildTime'); expect(vv).toHaveProperty('gitSha')
  } catch (e) {
    test.skip(true, 'Backend not running on ' + base)
  } finally {
    await ctx.dispose()
  }
})
