import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'
import { execSync } from 'node:child_process'

const gitHash = execSync('git rev-parse --short HEAD').toString().trim()
const gitHashFull = execSync('git rev-parse HEAD').toString().trim()

export default defineConfig({
  define: {
    __APP_HASH__: JSON.stringify(gitHash),
    __APP_COMMIT_URL__: JSON.stringify(`https://github.com/anukauchika/anukauchika.github.io/commit/${gitHashFull}`),
  },
  plugins: [
    sveltekit(),
    VitePWA({
      base: '/',
      buildBase: '/',
      scope: '/',
      devOptions: {
        enabled: true,
        suppressWarnings: true,
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
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.svelte'],
  },
  server: {
    fs: {
      allow: [
        path.resolve('.'),
        path.resolve('data'),
      ],
    },
  },
})
