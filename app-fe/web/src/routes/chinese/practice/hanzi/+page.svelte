<script>
  import { page } from '$app/stores'
  import { onMount } from 'svelte'
  import { sttDataset } from '@stt/dataset.svelte.js'
  import { svcDataset } from '@svc/dataset'
  import { ps, loadDatasetGroupSessions, loadGroupStats, groupStats, startGroupSession, endGroupSession, recordWordAttempt } from '@stt/kind/chinese/practice-stats.js'
  import { sttAuth } from '@stt/auth.svelte.js'
  import { asChineseDataset } from '@dom/kind/chinese/dataset'
  import { get } from 'svelte/store'
  import Island from '@std/ui/island.svelte'
  import IslandTitle from '@std/ui/island-title.svelte'
  import Tags from '@std/ui/tags.svelte'
  import PracticeStroke from '@uic/kind/chinese/practice-stroke.svelte'

  onMount(() => {
    const requested = $page.url.searchParams.get('dataset')
    if (requested) svcDataset.selectDataset(requested)
  })

  $effect(() => {
    if (sttDataset.id) loadDatasetGroupSessions(sttDataset.id, 'stroke')
  })

  const practiceGroupId = $derived.by(() => {
    return Number($page.url.searchParams.get('group')) || 1
  })

  const groups = $derived.by(() => asChineseDataset(sttDataset.current)?.groups ?? [])

  const practiceGroup = $derived.by(() =>
    groups.find((g) => g.id === practiceGroupId) || groups[0]
  )

  const practiceGroupSessions = $derived.by(() =>
    practiceGroup ? $ps.datasetGroupSessions.get(practiceGroup.id) : null
  )

  const handleLoadGroupStats = async (dsId, pt, gId) => {
    await loadGroupStats(dsId, pt, gId)
    return get(groupStats)
  }

  const backUrl = $derived.by(() => {
    const from = $page.url.searchParams.get('from')
    const base = `/${sttDataset.current?.kind ?? 'chinese'}`
    if (from) return `${base}/${from}?dataset=${sttDataset.id}`
    return `${base}/?dataset=${sttDataset.id}`
  })
</script>

<svelte:head>
  <title>Stroke Practice - Anuka Uchika</title>
</svelte:head>

<main class="anuka-page">
  {#if practiceGroup}
    <PracticeStroke group={practiceGroup} datasetId={sttDataset.id} {backUrl}
      groupStats={$ps.groupStats} isAuthenticated={sttAuth.isAuthenticated}
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
        {#if sttAuth.isAuthenticated && practiceGroupSessions}
          <span class="anuka-sm anuka-main">{practiceGroupSessions.total} passes ({practiceGroupSessions.full} full)</span>
        {/if}
      </div>
    {/if}
  </Island>
</main>
