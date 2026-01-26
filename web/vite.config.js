import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  server: {
    fs: {
      allow: [
        path.resolve(__dirname),
        path.resolve(__dirname, '..', 'data'),
      ],
    },
  },
})
