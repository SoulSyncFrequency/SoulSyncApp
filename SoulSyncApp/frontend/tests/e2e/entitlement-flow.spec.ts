import { test, expect } from '@playwright/test'

test('paywall page renders', async ({ page }) => {
  await page.goto('/paywall')
  await expect(page.locator('text=Unlock full access')).toBeVisible()
})
