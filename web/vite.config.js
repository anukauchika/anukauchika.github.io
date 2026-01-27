import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  base: '/memris/',
  plugins: [svelte()],
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
