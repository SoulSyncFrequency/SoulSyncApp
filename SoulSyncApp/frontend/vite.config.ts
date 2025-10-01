import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  define: { 'import.meta.env.VITE_RELEASE': JSON.stringify(process.env.VITE_RELEASE || '') },
  plugins: [
    react(),
    ...(process.env.ANALYZE ? [visualizer({ filename: 'stats.html', open: true })] : [])
  ],
  server: { port: 5173 },
  build: { outDir: 'dist', sourcemap: true }
})
