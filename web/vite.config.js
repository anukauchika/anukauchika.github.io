import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  base: '/memris/',
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'],
      manifest: {
        name: 'Memris',
        short_name: 'Memris',
        description: 'Chinese characters with stroke writing practice, focused word groups, stats-driven spaced repetition, and progress tracking',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/memris/',
        start_url: '/memris/',
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
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        chinese: path.resolve(__dirname, 'chinese/index.html'),
        chineseWorkbook: path.resolve(__dirname, 'chinese/workbook.html'),
        chinesePractice: path.resolve(__dirname, 'chinese/practice.html'),
        english: path.resolve(__dirname, 'english/index.html'),
        englishWorkbook: path.resolve(__dirname, 'english/workbook.html'),
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
