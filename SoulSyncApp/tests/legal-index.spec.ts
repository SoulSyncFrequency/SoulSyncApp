import { test, expect } from '@playwright/test'

test('legal index lists all legal pages and shows last-updated', async ({ page }) => {
  await page.goto('/legal/index.html')
  await expect(page.locator('#last-updated')).toBeVisible()
  await expect(page.getByRole('link', { name: /Privacy Policy/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /Terms of Service/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /Cookie Policy/i })).toBeVisible()
})
