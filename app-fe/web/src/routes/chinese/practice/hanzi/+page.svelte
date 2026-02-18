<script>
  import { page } from '$app/stores'
  import { onMount } from 'svelte'
  import { datasetId, currentDataset } from '@stt/dataset.js'
  import { datasetService } from '@svc/dataset-service'
  import { loadDatasetGroupSessions, datasetGroupSessions, loadGroupStats, groupStats as groupStatsStore, startGroupSession, endGroupSession, recordWordAttempt } from '@stt/kind/chinese/practice-stats.js'
  import { isAuthenticated } from '@stt/auth.js'
  import { asChineseDataset } from '@dom/kind/chinese/dataset'
  import { get } from 'svelte/store'
  import Island from '@std/ui/island.svelte'
  import IslandTitle from '@std/ui/island-title.svelte'
  import Tags from '@std/ui/tags.svelte'
  import PracticeStroke from '@uic/kind/chinese/practice-stroke.svelte'

  onMount(() => {
    const requested = $page.url.searchParams.get('dataset')
    if (requested) datasetService.selectDataset(requested)
  })

  $effect(() => {
    if ($datasetId) loadDatasetGroupSessions($datasetId, 'stroke')
  })

  const practiceGroupId = $derived.by(() => {
    return Number($page.url.searchParams.get('group')) || 1
  })

  const groups = $derived.by(() => asChineseDataset($currentDataset)?.groups ?? [])

  const practiceGroup = $derived.by(() =>
    groups.find((g) => g.id === practiceGroupId) || groups[0]
  )

  const practiceGroupSessions = $derived.by(() =>
    practiceGroup ? $datasetGroupSessions.get(practiceGroup.id) : null
  )

  const handleLoadGroupStats = async (dsId, pt, gId) => {
    await loadGroupStats(dsId, pt, gId)
    return get(groupStatsStore)
  }

  const backUrl = $derived.by(() => {
    const from = $page.url.searchParams.get('from')
    const base = `/${$currentDataset?.kind ?? 'chinese'}`
    if (from) return `${base}/${from}?dataset=${$datasetId}`
    return `${base}/?dataset=${$datasetId}`
  })
</script>

<svelte:head>
  <title>Stroke Practice - Anuka Uchika</title>
</svelte:head>

<main class="anuka-page">
  {#if practiceGroup}
    <PracticeStroke group={practiceGroup} datasetId={$datasetId} {backUrl}
      groupStats={$groupStatsStore} isAuthenticated={$isAuthenticated}
      onLoadGroupStats={handleLoadGroupStats} onStartSession={startGroupSession} onEndSession={endGroupSession} onRecordAttempt={recordWordAttempt} />
  {/if}

  <Island>
    <IslandTitle level={1}>Stroke Practice</IslandTitle>
    {#if practiceGroup}
      <div class="anuka-row anuka-center">
        <span class="anuka-sm anuka-mute">{practiceGroup.displayId}</span>
        {#if practiceGroup.tags?.length}
          <Tags tags={practiceGroup.tags} />
        {/if}
        <span class="anuka-sm anuka-mute">{practiceGroup.items.length} words</span>
        {#if $isAuthenticated && practiceGroupSessions}
          <span class="anuka-sm anuka-main">{practiceGroupSessions.total} passes ({practiceGroupSessions.full} full)</span>
        {/if}
      </div>
    {/if}
  </Island>
</main>
