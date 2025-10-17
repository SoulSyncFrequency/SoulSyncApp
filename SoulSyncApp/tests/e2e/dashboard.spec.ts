// Basic Playwright skeleton (install in your CI: npm i -D @playwright/test && npx playwright install)
import { test, expect } from '@playwright/test'

test('dashboard loads', async ({ page }) => {
  await page.goto('http://localhost:5173/admin/dashboard')
  await expect(page.getByText('Admin Dashboard')).toBeVisible()
})

test('docs page renders and has TOC', async ({ page }) => {
  await page.goto('http://localhost:5173/admin/docs/alerting')
  await expect(page.getByText('Alerting Documentation')).toBeVisible()
})
