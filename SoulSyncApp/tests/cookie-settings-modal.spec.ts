import { test, expect } from '@playwright/test'

test('Cookie Settings modal shows and displays Last updated line', async ({ page }) => {
  // Reset consent to force banner/footer availability
  await page.addInitScript(() => localStorage.clear())
  await page.goto('/')

  // Open via persistent footer link or banner button
  const footerLink = page.getByText(/Cookie Settings|Postavke kolačića/).first()
  if (await footerLink.isVisible()) {
    await footerLink.click()
  } else {
    await page.getByRole('button', { name: /Cookie Settings|Postavke kolačića/ }).click()
  }

  // Modal Title
  await expect(page.getByRole('heading', { name: /Cookie Settings|Postavke kolačića/ })).toBeVisible()

  // Last updated line inside modal
  await expect(page.locator('text=Last updated: Sep 2025')).toBeVisible()

  // Necessary is disabled, Analytics exists as a toggle
  const necessary = page.locator('label:has-text("Necessary"), label:has-text("Neophodni")').locator('input[type="checkbox"]')
  await expect(necessary.first()).toBeDisabled()

  const analytics = page.locator('label:has-text("Analytics"), label:has-text("Analitički")').locator('input[type="checkbox"]')
  await expect(analytics.first()).toBeVisible()

  // Close modal
  const cancelBtn = page.getByRole('button', { name: /Cancel|Odustani/ })
  if (await cancelBtn.count()) {
    await cancelBtn.click()
  }
})
