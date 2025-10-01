import { test, expect } from '@playwright/test';

test('analytics does not load before consent and loads after accept', async ({ page }) => {
  // Clear any old consent
  await page.addInitScript(() => localStorage.clear())
  await page.goto('/')

  // Expect NO analytics placeholder initially
  await expect(page.locator('text=Analytics placeholder loaded')).toHaveCount(0)

  // Open settings, accept analytics
  await page.getByText('Cookie Settings').first().click()
  // Toggle Analytics if banner shows modal, otherwise Accept All
  const analyticsToggle = page.locator('label:has-text("Analytics"), label:has-text("Analitički")').locator('input[type="checkbox"]')
  if (await analyticsToggle.count()) {
    await analyticsToggle.first().check()
    await page.getByRole('button', { name: /Save|Spremi/ }).click()
  } else {
    await page.getByRole('button', { name: /Accept All|Prihvaćam sve/ }).click()
  }

  // Reload to simulate typical flow
  await page.reload()

  // Now analytics placeholder should be present
  await expect(page.locator('text=Analytics placeholder loaded')).toHaveCount(1)
});
