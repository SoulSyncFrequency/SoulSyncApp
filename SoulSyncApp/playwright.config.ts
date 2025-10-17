import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173' },
  projects: [ { name: 'chromium', use: { ...devices['Desktop Chrome'] } } ]
})
