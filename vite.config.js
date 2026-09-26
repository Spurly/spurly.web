import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      src: path.resolve(__dirname, 'src'),
    },
  },
  build: {
    // scripts/prerender.mjs reads the manifest to link the website's CSS and
    // JS chunks into each prerendered page (and deletes it afterwards).
    manifest: true,
  },
  ssr: {
    // CommonJS package whose named exports Node's ESM loader can't see —
    // bundle it into dist-ssr instead of importing it at prerender time.
    noExternal: ['react-helmet-async'],
  },
  server: {
    port: 3000,
    open: true
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.{js,jsx}'],
    exclude: ['tests/_trash/**'],
    // The app is one bundle today; tests import real modules and stub only the
    // network layer, so a run stays fast without per-file isolation overhead.
    restoreMocks: true,
  },
})
