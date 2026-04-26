import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { writeFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      // The `chatui/css` subpath export points at a real .css file, but TypeScript's
      // `noUncheckedSideEffectImports` requires a .d.ts alongside it.
      name: 'chatui-css-dts',
      apply: 'build',
      closeBundle() {
        mkdirSync(resolve('dist'), { recursive: true })
        writeFileSync(resolve('dist/chatui.css.d.ts'), 'export {}\n')
      },
    },
  ],
  build: {
    lib: {
      entry: {
        index:        'src/index.ts',
        store:        'src/store/settingsStore.ts',
        'chat-store': 'src/store/chatStore.ts',
        types:        'src/types/index.ts',
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [/^react($|\/)/, /^react-dom($|\/)/],
      output: {
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (info) => {
          if (info.name && info.name.endsWith('.css')) return 'chatui.css'
          return 'assets/[name]-[hash][extname]'
        },
      },
    },
    cssCodeSplit: false,
    sourcemap: true,
    target: 'es2022',
  },
  resolve: {
    alias: {
      // React 18+ has useSyncExternalStore built in; bypass the CJS shim that
      // react-i18next pulls in via use-sync-external-store/shim. Otherwise
      // Rolldown bundles it as CJS and emits a runtime require("react") that
      // breaks in browsers.
      'use-sync-external-store/shim/index.js': resolve('src/shims/use-sync-external-store-shim.ts'),
      'use-sync-external-store/shim': resolve('src/shims/use-sync-external-store-shim.ts'),
    },
  },
  optimizeDeps: {
    // Dev-server only: the host's vite config doesn't need this once consuming
    // the published package.
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
