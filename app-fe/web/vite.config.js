import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    // SPA fallback: rewrite /chinese/*, /english/* sub-paths to their index.html
    {
      name: 'spa-fallback',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url.split('?')[0]
          const qs = req.url.includes('?') ? '?' + req.url.split('?')[1] : ''
          if (url.startsWith('/chinese/') && !url.includes('.') && url !== '/chinese/') {
            req.url = '/chinese/index.html' + qs
          } else if (url.startsWith('/english/') && !url.includes('.') && url !== '/english/') {
            req.url = '/english/index.html' + qs
          }
          next()
        })
      },
    },
    svelte(),
    VitePWA({
      devOptions: {
        enabled: false
      },
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'],
      manifest: {
        name: 'Anuka Uchika',
        short_name: 'Anuka Uchika',
        description: 'Vocabulary learning with stroke writing practice, focused word groups, stats-driven spaced repetition, and progress tracking',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2}'],
        navigateFallback: null
      }
    })
  ],
  resolve: {
    alias: {
      '@std': path.resolve(__dirname, 'src/lib/std'),
      '@app': path.resolve(__dirname, 'src/lib/app'),
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.svelte'],
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        chinese: path.resolve(__dirname, 'chinese/index.html'),
        english: path.resolve(__dirname, 'english/index.html'),
        designBook: path.resolve(__dirname, 'design-book.html'),
      },
    },
  },
  server: {
    fs: {
      allow: [
        path.resolve(__dirname),
        path.resolve(__dirname, '..', 'data'),
      ],
    },
  },
})
