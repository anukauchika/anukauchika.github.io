<script>
  import { page } from '$app/stores'
  import { onMount } from 'svelte'
  import { sttDataset } from '@stt/dataset.svelte.js'
  import { svcDataset } from '@svc/dataset'
  import { sttStats } from '@stt/kind/chinese/stats.svelte.js'
  import { sttDrill } from '@stt/kind/chinese/drill.svelte.js'
  import { svcStats } from '@svc/kind/chinese/stats'
  import { svcDrill } from '@svc/kind/chinese/drill'
  import { sttAuth } from '@stt/auth.svelte.js'
  import { asChineseDataset } from '@dom/kind/chinese/dataset'
  import Island from '@std/ui/island.svelte'
  import IslandTitle from '@std/ui/island-title.svelte'
  import Tags from '@std/ui/tags.svelte'
  import DrillPinyin from '@uic/kind/chinese/drill-pinyin.svelte'

  onMount(() => {
    const requested = $page.url.searchParams.get('dataset')
    if (requested) svcDataset.selectDataset(requested)
  })

  $effect(() => {
    if (sttDataset.id) svcStats.loadGroupProgressAll(sttDataset.id)
  })

  const drillGroupId = $derived.by(() => {
    return Number($page.url.searchParams.get('group')) || 1
  })

  const groups = $derived.by(() => asChineseDataset(sttDataset.current)?.groups ?? [])

  const drillGroup = $derived.by(() => groups.find((g) => g.id === drillGroupId) || groups[0])

  const drillGroupSessions = $derived.by(() => (drillGroup ? sttStats.groupProgress.get(drillGroup.id) : null))

  const handleLoadGroupStats = async (dsId, pt, gId) => {
    await svcDrill.loadProgress(dsId, pt, gId)
    return sttDrill.progress
  }

  const handleRecordAttempt = (drillId, wordId, startedAt, doneAt, chars) =>
    svcDrill.recordAttempt(drillId, { wordId, startedAt, doneAt }, chars)

  const backUrl = $derived.by(() => {
    const from = $page.url.searchParams.get('from')
    const base = `/${sttDataset.current?.kind ?? 'chinese'}`
    if (from) return `${base}/${from}?dataset=${sttDataset.id}`
    return `${base}/?dataset=${sttDataset.id}`
  })
</script>

<svelte:head>
  <title>Pinyin Drill - Anuka Uchika</title>
</svelte:head>

<main class="anuka-page">
  {#if drillGroup}
    <DrillPinyin
      group={drillGroup}
      datasetId={sttDataset.id}
      {backUrl}
      groupStats={sttDrill.progress}
      isAuthenticated={sttAuth.isAuthenticated}
      onLoadGroupStats={handleLoadGroupStats}
      onStartSession={svcDrill.startDrill}
      onEndSession={svcDrill.endDrill}
      onRecordAttempt={handleRecordAttempt}
    />
  {/if}

  <Island>
    <div class="anuka-row anuka-center">
      <IslandTitle level={1} class="anuka-center">Pinyin Drill</IslandTitle>
    </div>
    {#if drillGroup}
      <div class="anuka-row anuka-center">
        <span class="anuka-sm anuka-mute">{drillGroup.displayId}</span>
        {#if drillGroup.tags?.length}
          <Tags tags={drillGroup.tags} />
        {/if}
        <span class="anuka-sm anuka-mute">{drillGroup.items.length} words</span>
        {#if sttAuth.isAuthenticated && drillGroupSessions}
          <span class="anuka-sm anuka-main">{drillGroupSessions.total} passes ({drillGroupSessions.full} full)</span>
        {/if}
      </div>
    {/if}
  </Island>
</main>
