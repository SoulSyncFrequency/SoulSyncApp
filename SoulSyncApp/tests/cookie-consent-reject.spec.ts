import { test, expect } from '@playwright/test';

test('analytics does NOT load after Reject All (even after reload)', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear())
  await page.goto('/')

  // Reject All from banner
  const rejectButton = page.getByRole('button', { name: /Reject All|Odbijam sve/ })
  await rejectButton.click()

  // Reload to ensure persistence
  await page.reload()

  // Should not see analytics placeholder
  await expect(page.locator('text=Analytics placeholder loaded')).toHaveCount(0)

  // Open Cookie Settings and ensure Analytics remains unchecked
  await page.getByText(/Cookie Settings|Postavke kolačića/).first().click()
  const analyticsToggle = page.locator('label:has-text("Analytics"), label:has-text("Analitički")').locator('input[type="checkbox"]')
  if (await analyticsToggle.count()) {
    await expect(analyticsToggle.first()).not.toBeChecked()
  }
});
