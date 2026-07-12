<script>
  import { browser } from '$app/environment'
  import { page } from '$app/stores'
  import { sttDataset } from '@stt/dataset.svelte.js'

  let { children } = $props()

  const ready = $derived(sttDataset.ready)
</script>

<svelte:head>
  {#if $page.route.id !== '/(app)/chinese'}
    <meta name="robots" content="noindex" />
  {/if}
</svelte:head>

<!-- !browser: SSR'd pages (/chinese) must render their static head & intro at prerender time -->
{#if ready || !browser}
  {@render children()}
{/if}
