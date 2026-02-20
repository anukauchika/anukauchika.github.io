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
  import ProgressLine from '@std/ui/progress-line.svelte'
  import Tags from '@std/ui/tags.svelte'
  import Btn from '@std/ui/btn.svelte'
  import DrillPinyin from '@uic/kind/chinese/drill-pinyin.svelte'

  onMount(() => {
    const requested = $page.url.searchParams.get('dataset')
    if (requested) svcDataset.selectDataset(requested)
  })

  $effect(() => {
    if (sttDataset.id) svcStats.loadGroupProgressAll(sttDataset.id)
  })

  const drillGroupId = $derived.by(() => Number($page.url.searchParams.get('group')) || 1)
  const groups = $derived.by(() => asChineseDataset(sttDataset.current)?.groups ?? [])
  const drillGroup = $derived.by(() => groups.find((g) => g.id === drillGroupId) || groups[0])
  const drillGroupSessions = $derived.by(() => (drillGroup ? sttStats.groupProgress.get(drillGroup.id) : null))

  const backUrl = $derived.by(() => {
    const from = $page.url.searchParams.get('from')
    const base = `/${sttDataset.current?.kind ?? 'chinese'}`
    if (from) return `${base}/${from}?dataset=${sttDataset.id}`
    return `${base}/?dataset=${sttDataset.id}`
  })

  $effect(() => {
    if (sttDataset.id && drillGroup) {
      svcDrill.initSession(sttDataset.id, 'pinyin', drillGroup.id, drillGroup.items)
    }
  })
</script>

<svelte:head>
  <title>Pinyin Drill - Anuka Uchika</title>
</svelte:head>

<main class="anuka-page">
  {#if sttDrill.currentItem && !sttDrill.sessionDone}
    <Island>
      <a class="anuka-quick" href={backUrl} title="Back">
        <span class="anuka-icon anuka-icon-close"></span>
      </a>
      <div class="anuka-row">
        {#if sttAuth.isAuthenticated && sttDrill.currentStat}
          <span class="anuka-badge anuka-main">
            {sttDrill.currentStat.successCount}
            {#if sttDrill.currentStat.errorCount > 0}
              <span class="anuka-fail">| {sttDrill.currentStat.errorCount}</span>
            {/if}
          </span>
        {:else}
          <div class="anuka-placeholder"></div>
        {/if}
      </div>
      <DrillPinyin />
    </Island>
  {/if}

  {#if sttDrill.sessionDone}
    <Island>
      <div class="anuka-stack anuka-center anuka-compact">
        <div class="anuka-main anuka-lg">Session complete</div>
        <div class="anuka-mute anuka-sm">{sttDrill.drilledCount} drilled &middot; {sttDrill.skippedCount} skipped</div>
        <Btn main onclick={() => svcDrill.restart()}>Restart</Btn>
        <Btn onclick={() => (window.location.href = backUrl)}>Groups</Btn>
      </div>
    </Island>
  {/if}

  <ProgressLine fill={sttDrill.progress}>
    {#snippet bottom()}<div class="anuka-row anuka-center">
        <span class="anuka-mute anuka-sm">{sttDrill.currentIndex + 1} / {sttDrill.items.length}</span>
      </div>{/snippet}
  </ProgressLine>

  <div class="anuka-tags anuka-center">
    {#each sttDrill.items as item, idx}
      {@const stat = sttDrill.wordProgress.get(item.id)}
      <span class="anuka-tag" class:anuka-main={idx === sttDrill.currentIndex} title={item.word}>
        {item.tr}
        {#if sttAuth.isAuthenticated && stat}
          <span class="anuka-succ">{stat.successCount}</span>
          {#if stat.errorCount > 0}
            <span> | </span>
            <span class="anuka-fail">{stat.errorCount}</span>
          {/if}
        {/if}
      </span>
    {/each}
  </div>

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
