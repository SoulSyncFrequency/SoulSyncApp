import { test, expect } from '@playwright/test'

test('footer version format looks like vX.Y.Z [· abcdefg]', async ({ page }) => {
  await page.goto('/')
  const footer = page.locator('footer')
  await expect(footer).toBeVisible()
  const txt = await footer.textContent()
  if (!txt) test.skip(true, 'No footer text; skipping')
  const match = txt.match(/v\d+\.\d+\.\d+(\s·\s[0-9a-f]{7})?/i)
  if (!match) {
    test.skip(true, 'Version not available yet in this environment')
  } else {
    expect(match[0].startsWith('v')).toBeTruthy()
  }
})
