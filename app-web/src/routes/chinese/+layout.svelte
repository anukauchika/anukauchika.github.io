<script>
  import { page } from '$app/stores'
  import { sttDataset } from '@stt/dataset.svelte.js'
  import { svcDataset } from '@svc/dataset'
  import { svcStats } from '@svc/kind/chinese/stats'

  let { children } = $props()

  const requestedDataset = $derived($page.url.searchParams.get('dataset') || sttDataset.id)
  const datasetReady = $derived(sttDataset.current?.id === requestedDataset)

  $effect(() => {
    if (requestedDataset && requestedDataset !== sttDataset.id) svcDataset.selectDataset(requestedDataset)
  })

  $effect(() => {
    if (sttDataset.id) svcStats.loadGroupProgressAll(sttDataset.id)
  })
</script>

{#if datasetReady}
  {@render children()}
{/if}
