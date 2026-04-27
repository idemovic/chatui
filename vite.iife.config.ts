// Build the IIFE / CDN bundle: a single self-contained file that exposes
// `Chatui.createChat({...})` on the global. React + ReactDOM are bundled in
// (no externals) so the page needs nothing pre-installed.

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Replace Node-only globals at build time so the IIFE runs in raw browsers.
  // (For the ESM build, the consumer's bundler does this — for IIFE we must.)
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env': '({})',
  },
  resolve: {
    alias: {
      // Same shim as the ESM build — bypass the CJS use-sync-external-store/shim
      // to avoid a runtime require('react') trap.
      'use-sync-external-store/shim/index.js': resolve('src/shims/use-sync-external-store-shim.ts'),
      'use-sync-external-store/shim': resolve('src/shims/use-sync-external-store-shim.ts'),
    },
  },
  build: {
    lib: {
      entry: 'src/createChat.ts',
      name: 'Chatui',
      formats: ['iife'],
      fileName: () => 'chatui.iife.js',
    },
    rollupOptions: {
      // Bundle EVERYTHING — including React — so the file works on a bare HTML page.
      external: [],
      output: {
        // Don't overwrite the ESM build's chatui.css.
        // IIFE format implies a single chunk, so dynamic imports are inlined automatically.
        assetFileNames: (info) => {
          if (info.name && info.name.endsWith('.css')) return 'chatui.iife.css'
          return 'assets/[name]-[hash][extname]'
        },
      },
    },
    cssCodeSplit: false,
    sourcemap: true,
    target: 'es2022',
    // Don't wipe the ESM build's output (index.js, store.js, .d.ts files).
    emptyOutDir: false,
  },
})
