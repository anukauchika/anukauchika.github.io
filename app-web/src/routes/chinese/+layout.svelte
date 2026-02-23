<script>
  import { page } from '$app/stores'
  import { goto } from '$app/navigation'
  import { sttDataset } from '@stt/dataset.svelte.js'
  import { svcDataset } from '@svc/dataset'
  import { svcStats } from '@svc/kind/chinese/stats'

  let { children } = $props()

  const urlDataset = $derived($page.url.searchParams.get('dataset'))
  const datasetReady = $derived(sttDataset.current?.id === sttDataset.id)

  // Store URL filter overrides so the service can re-apply them after any prefs reload
  $effect(() => {
    const params = $page.url.searchParams
    const tags = params.get('tags')
    const groups = params.get('groups')
    const search = params.get('search')
    if (tags || groups || search) {
      sttDataset.urlFilters = {
        search: search || undefined,
        tags: tags ? tags.split(',').filter(Boolean) : undefined,
        groups: groups ? groups.split(',').map(Number).filter(n => !isNaN(n)) : undefined,
      }
    } else {
      sttDataset.urlFilters = null
    }
  })

  $effect(() => {
    if (urlDataset && urlDataset !== sttDataset.id) {
      svcDataset.selectDataset(urlDataset)
    } else if (urlDataset && urlDataset === sttDataset.id && sttDataset.urlFilters) {
      svcDataset.applyUrlFilters()
    } else if (!urlDataset && sttDataset.id) {
      const url = new URL($page.url)
      url.searchParams.set('dataset', sttDataset.id)
      goto(`${url.pathname}${url.search}`, { replaceState: true, keepFocus: true })
    }
  })

  $effect(() => {
    if (sttDataset.id) svcStats.loadGroupProgressAll(sttDataset.id)
  })
</script>

{#if datasetReady}
  {@render children()}
{/if}
