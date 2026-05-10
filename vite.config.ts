import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wyw from '@wyw-in-js/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [
    react({
      exclude: ['node_modules/**'],
    }),
    wyw({
      sourceMap: process.env.NODE_ENV !== 'production',
      displayName: process.env.NODE_ENV !== 'production',
      exclude: ['node_modules/**'],
      evaluate: false,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.svg'],
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: './dist',
    emptyOutDir: true,
    sourcemap: true,
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/'))
            return 'vendor';
          if (id.includes('node_modules/react-router')) return 'router';
          if (id.includes('node_modules/shiki')) return 'shiki';
        },
      },
    },
  },
  server: {
    port: parseInt(process.env.PORT || '3000'),
    host: true,
    proxy: {
      '/global': {
        target: 'http://localhost:4099',
        changeOrigin: true,
        ws: true,
      },
      '/session': {
        target: 'http://localhost:4099',
        changeOrigin: true,
      },
      '/event': {
        target: 'http://localhost:4099',
        changeOrigin: true,
      },
      '/file': {
        target: 'http://localhost:4099',
        changeOrigin: true,
      },
      '/find': {
        target: 'http://localhost:4099',
        changeOrigin: true,
      },
      '/pty': {
        target: 'http://localhost:4099',
        changeOrigin: true,
        ws: true,
      },
      '/provider': {
        target: 'http://localhost:4099',
        changeOrigin: true,
      },
      '/mcp': {
        target: 'http://localhost:4099',
        changeOrigin: true,
      },
      '/vcs': {
        target: 'http://localhost:4099',
        changeOrigin: true,
      },
      '/lsp': {
        target: 'http://localhost:4099',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:4099',
        changeOrigin: true,
      },
      '/config': {
        target: 'http://localhost:4099',
        changeOrigin: true,
      },
      '/project': {
        target: 'http://localhost:4099',
        changeOrigin: true,
      },
      '/permission': {
        target: 'http://localhost:4099',
        changeOrigin: true,
      },
      '/question': {
        target: 'http://localhost:4099',
        changeOrigin: true,
      },
    },
  },
});
