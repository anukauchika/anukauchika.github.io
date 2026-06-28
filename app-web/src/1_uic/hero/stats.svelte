<script>
  import Stat from '@std/ui/stat.svelte'
  import { formatDuration } from '@std/format.js'

  let {
    groupCount,
    totalCount,
    uniqueWordCount,
    uniqueChars,
    avgDailyTime,
    strokeDrilledCount,
    dueCount = 0,
    isAuthenticated,
    onShowProgressGroups,
    onShowProgressWords,
    onShowProgressChars,
    onShowDrillQueue,
  } = $props()

  const handleGroups = () => {
    if (isAuthenticated) onShowProgressGroups()
  }
  const handleChars = () => {
    if (isAuthenticated) onShowProgressChars()
  }
</script>

<div class="anuka-row anuka-center">
  <Stat value={groupCount} label={isAuthenticated ? 'Active' : 'Groups'} onclick={handleGroups} />
  <Stat value={totalCount} label="Words" />
  <Stat value={uniqueWordCount} label="Unique" />
  <Stat value={uniqueChars} label="Chars" onclick={handleChars} />
  {#if isAuthenticated}
    <Stat value={strokeDrilledCount} label="Drilled" onclick={onShowProgressWords} />
    <Stat value={formatDuration(avgDailyTime)} label="Avg/Day" />
    <Stat value={dueCount} label="Due" class={dueCount > 0 ? 'anuka-warn' : ''} onclick={onShowDrillQueue} />
  {/if}
</div>
