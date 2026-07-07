<script>
  import { browser } from '$app/environment'
  import { sttDataset } from '@stt/dataset.svelte.js'

  let { children } = $props()

  const ready = $derived(sttDataset.ready)
</script>

<svelte:head>
  <meta name="robots" content="noindex" />
</svelte:head>

<!-- !browser: SSR'd pages (/chinese) must render their static head & intro at prerender time -->
{#if ready || !browser}
  {@render children()}
{/if}
