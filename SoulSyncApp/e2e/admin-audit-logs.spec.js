import { test, expect } from '@playwright/test';

test('Admin Audit Logs dashboard loads', async ({ page }) => {
  await page.goto('http://localhost:3000/admin/audit-logs');
  await expect(page.locator('h1')).toContainText('Audit Logs');
  await expect(page.locator('table')).toBeVisible();
  await expect(page.getByText('Export CSV')).toBeVisible();
  await expect(page.getByText('Export JSON')).toBeVisible();
  await expect(page.getByText('Export XLSX')).toBeVisible();
});
