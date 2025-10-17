import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    globals: true,
    coverage: {
      provider: 'c8',
      reporter: ['text', 'html', 'lcov', 'junit'],
      reportsDirectory: './coverage',
      thresholds: { lines: 80, functions: 80, branches: 70, statements: 80 }
    }
  }
})
