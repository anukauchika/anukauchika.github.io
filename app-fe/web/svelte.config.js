import adapter from '@sveltejs/adapter-static'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import("@sveltejs/kit").Config} */
export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: 'dist',
      assets: 'dist',
      fallback: 'index.html',
    }),
    alias: {
      '@std': 'src/lib/std',
      '@app': 'src/lib/app',
      '@data': '../data',
    },
  },
}
