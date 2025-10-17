import { defineConfig, devices } from '@playwright/test';
export default defineConfig({ testDir: './tests', use: { baseURL: 'http://localhost:4173' }, projects: [ { name:'chromium', use: { ...devices['Desktop Chrome'] } } ] });
