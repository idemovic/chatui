import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

import { resolve } from 'path'

console.log('adfadsfasd')
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    cssInjectedByJsPlugin({
      jsAssetsFilterFunction: (chunk) => chunk.fileName === 'index.js',
    }),
    {
      name: 'graceful-exit',
      configureServer(server) {
        process.on('SIGINT', () => {
          server.close().then(() => process.exit(0))
        })
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
        assetFileNames: 'assets/[name]-[hash][extname]',
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
   server: {
    host: "0.0.0.0",
    port: 2222
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
