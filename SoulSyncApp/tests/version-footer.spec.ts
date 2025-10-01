import { test, expect, request } from '@playwright/test'

async function getExpectedVersion() {
  const base = process.env.API_BASE_URL || 'http://localhost:3000'
  const ctx = await request.newContext()
  try {
    const r = await ctx.get(base + '/version')
    if (r.ok()) {
      const j = await r.json()
      const sha = (j.gitSha || '').slice(0,7)
      const ver = j.version ? `v${j.version}${sha ? ' · ' + sha : ''}` : ''
      await ctx.dispose()
      return ver || null
    }
  } catch {}
  try {
    const r2 = await ctx.get('http://localhost:5173/build-info.json') // dev server default
    if (r2.ok()) {
      const j2 = await r2.json()
      await ctx.dispose()
      return j2.version ? `v${j2.version}` : null
    }
  } catch {}
  await ctx.dispose()
  return null
}

test('footer shows version when available', async ({ page }) => {
  const expected = await getExpectedVersion()
  await page.goto('/')
  if (!expected) {
    test.skip(true, 'No version source available; skipping')
  }
  const footer = page.locator('footer')
  await expect(footer).toBeVisible()
  await expect(footer.getByText(/^v/i)).toBeVisible()
})
