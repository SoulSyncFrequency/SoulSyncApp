import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  define: { 'process.env.VITE_SENTRY_DSN': JSON.stringify(process.env.VITE_SENTRY_DSN || '') },
  plugins: (process.env.ANALYZE? [visualizer({ filename: 'stats.html', template: 'sunburst' }), react(), visualizer({ filename: 'stats.html', open: true })] : [react(), visualizer({ filename: 'stats.html', open: true })]),
  server: { port: 5173 },
  build: { outDir: 'dist' }
})
