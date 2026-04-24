import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: [
      'html-parse-stringify',
      'use-sync-external-store/shim',
      'style-to-js',
      'extend',
      'debug',
      'ms',
    ],
  },
})
