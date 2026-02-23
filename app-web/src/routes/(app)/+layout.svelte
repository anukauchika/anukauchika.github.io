<script>
  import { sttDataset } from '@stt/dataset.svelte.js'

  let { children } = $props()

  const ready = $derived(sttDataset.ready)
</script>

{#if ready}
  {@render children()}
{/if}
