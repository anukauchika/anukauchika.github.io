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
    uniqueWordCount,
    uniqueChars,
    avgDailyTime,
    strokeDrilledCount,
    dueCount,
    strokeProgress,
    strokeMastery,
    pinyinProgress,
    pinyinMastery,
    drillHref,
    drillOffline = false,
    onShowAuthDropdown,
    onShowProgressGroups,
    onShowProgressWords,
    onShowProgressChars,
    toolbar,
    filters,
    children,
  } = $props()

  // Activity heatmap
  const ACTIVITY_MAX = 200
  const PAST_DAYS = 60
  const FUTURE_DAYS = 7

  let selectedActivityDate = $state(null)

  const activityDays = $derived.by(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const pastDays = PAST_DAYS

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
    for (let i = 1; i <= FUTURE_DAYS; i++) {
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
      {uniqueWordCount}
      {uniqueChars}
      {avgDailyTime}
      {strokeDrilledCount}
      {dueCount}
      {isAuthenticated}
      {onShowProgressGroups}
      {onShowProgressWords}
      {onShowProgressChars}
    />

    {#if isAuthenticated}
      <div class="anuka-stack">
        <ProgressLine fill={strokeProgress} fillStrong={strokeMastery} />
        <ProgressLine fill={pinyinProgress} fillStrong={pinyinMastery} />
        <div>
          <DailyActivityHeatmap
            days={activityDays}
            max={ACTIVITY_MAX}
            selectedDate={selectedActivityDate}
            onselect={(d) => (selectedActivityDate = d)}
          />
        </div>
      </div>
    {:else}
      <p class="anuka-row anuka-center anuka-compact"><BtnLink onclick={onShowAuthDropdown}>Log in</BtnLink> to track your learning progress</p>
    {/if}

    <div class="anuka-row anuka-center">
      <Btn onclick={() => (window.location.href = '/chinese/blog/')}>Blog</Btn>
      {#if drillHref}
        <Btn main onclick={() => (window.location.href = drillHref)}>Drill</Btn>
      {/if}
    </div>
    {#if drillOffline}
      <p class="anuka-mute anuka-sm anuka-center">Offline. Using fallback drill.</p>
    {/if}

    {@render filters()}
  </div>
</Island>
