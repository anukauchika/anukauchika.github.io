import adapter from '@sveltejs/adapter-static'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import("@sveltejs/kit").Config} */
export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: 'dist',
      assets: 'dist',
      fallback: '404.html',
    }),
    alias: {
      '@dom': 'src/0_dom',
      '@routes': 'src/routes/(app)',
      '@blog': 'src/routes/(blog)',
      '@uic': 'src/1_uic',
      '@svc': 'src/2_svc',
      '@stt': 'src/3_stt',
      '@dat': 'src/4_dat',
      '@low': 'src/5_low',
      '@std': 'src/6_std',
      '@data': 'data',
    },
  },
}
