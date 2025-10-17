import { test, expect } from '@playwright/test'

const pages = [
  ['/privacy-policy.html', 'Privacy Policy'],
  ['/terms-of-service.html', 'Terms of Service'],
  ['/cookie-policy.html', 'Cookie Policy']
]

test.describe('Legal pages smoke', () => {
  for (const [path, name] of pages) {
    test(`loads ${name} and shows last-updated`, async ({ page }) => {
      await page.goto(path)
      const span = page.locator('#last-updated')
      await expect(span).toBeVisible()
      const text = (await span.textContent()) || ''
      // Accept either 'dev' (vite dev fallback) or a Month + optional (vX.Y.Z)
      const ok = /^(dev|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(text.trim())
      expect(ok, `Unexpected last-updated text: "${text}"`).toBeTruthy()
    })
  }
})
