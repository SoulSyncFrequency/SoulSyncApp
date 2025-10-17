import { defineConfig } from '@playwright/test'

export default defineConfig({
  timeout: 30000,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000'
  },
  webServer: {
    command: 'npm start',
    cwd: './',
    env: { NODE_ENV: 'development' },
    url: 'http://localhost:3000/healthz',
    timeout: 60000,
    reuseExistingServer: !process.env.CI,
  }
})
