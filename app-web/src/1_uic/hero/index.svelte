<script>
  import { toLocalDateKey } from '@std/format.js'
  import Island from '@std/ui/island.svelte'
  import IslandTitle from '@std/ui/island-title.svelte'
  import Tags from '@std/ui/tags.svelte'
  import Btn from '@std/ui/btn.svelte'
  import BtnLink from '@std/ui/btn-link.svelte'
  import ProgressLine from '@std/ui/progress-line.svelte'
  import DailyActivityHeatmap from '@uic/daily-activity-heatmap.svelte'
  import Stats from '@uic/hero/stats.svelte'

  let {
    datasetName,
    datasetDescription,
    datasetTags,
    datasetId,
    dailyActivity,
    isAuthenticated,
    groupCount,
    totalCount,
    uniqueChars,
    strokeDrilledCount,
    strokeProgress,
    strokeMastery,
    pinyinProgress,
    pinyinMastery,
    drillHref,
    onShowAuthDropdown,
    onShowProgressGroups,
    onShowProgressWords,
    onShowProgressChars,
    toolbar,
    filters,
    children,
  } = $props()

  // Activity heatmap
  const ACTIVITY_MAX = 50
  const CELL_SIZE = 10
  const CELL_GAP = 3
  const FUTURE_DAYS_DESKTOP = 10
  const FUTURE_DAYS_MOBILE = 3

  let activityContainer = $state(null)
  let totalCells = $state(60)
  let futureDays = $state(FUTURE_DAYS_DESKTOP)
  let selectedActivityDate = $state(null)

  $effect(() => {
    if (!activityContainer) return
    const updateCells = () => {
      const isMobile = window.innerWidth <= 600
      futureDays = isMobile ? FUTURE_DAYS_MOBILE : FUTURE_DAYS_DESKTOP
      const width = activityContainer.offsetWidth
      totalCells = Math.floor((width + CELL_GAP) / (CELL_SIZE + CELL_GAP))
    }
    updateCells()
    const observer = new ResizeObserver(updateCells)
    observer.observe(activityContainer)
    return () => observer.disconnect()
  })

  const activityDays = $derived.by(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const pastDays = totalCells - futureDays

    const days = []
    for (let i = pastDays - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const key = toLocalDateKey(d)
      const entry = dailyActivity.get(key) || { count: 0, durationMs: 0, sessions: 0 }
      days.push({
        date: key,
        count: entry.count,
        durationMs: entry.durationMs,
        sessions: entry.sessions,
        isFuture: false,
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      })
    }
    for (let i = 1; i <= futureDays; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      days.push({
        date: toLocalDateKey(d),
        count: 0,
        durationMs: 0,
        sessions: 0,
        isFuture: true,
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      })
    }
    return days
  })

  // Reset activity selection on dataset change
  $effect(() => {
    datasetId
    selectedActivityDate = null
  })

  // Auto-select today
  $effect(() => {
    if (!selectedActivityDate) selectedActivityDate = toLocalDateKey(new Date())
  })
</script>

<Island>
  <div class="anuka-stack">
    {#if children}{@render children()}{/if}
    {@render toolbar()}

    <div>
      <IslandTitle level={1}>{datasetName ?? 'Vocabulary'}</IslandTitle>
      <p>{datasetDescription ?? ''}</p>
      {#if datasetTags?.length}
        <Tags tags={datasetTags} />
      {/if}
    </div>
    <Stats
      {groupCount}
      {totalCount}
      {uniqueChars}
      {strokeDrilledCount}
      {isAuthenticated}
      {onShowProgressGroups}
      {onShowProgressWords}
      {onShowProgressChars}
    />

    {#if isAuthenticated}
      <div class="anuka-stack">
        <ProgressLine fill={strokeProgress} fillStrong={strokeMastery} />
        <ProgressLine fill={pinyinProgress} fillStrong={pinyinMastery} />
        <div bind:this={activityContainer}>
          <DailyActivityHeatmap
            days={activityDays}
            max={ACTIVITY_MAX}
            selectedDate={selectedActivityDate}
            onselect={(d) => (selectedActivityDate = d)}
          />
        </div>
      </div>
    {:else}
      <p><BtnLink onclick={onShowAuthDropdown}>Log in</BtnLink> to track your learning progress</p>
    {/if}

    {#if drillHref}
      <div class="anuka-row anuka-center">
        <Btn main onclick={() => (window.location.href = drillHref)}>Drill</Btn>
      </div>
    {/if}

    {@render filters()}
  </div>
</Island>
