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
    isAuthenticated,
    onShowProgressGroups,
    onShowProgressWords,
    onShowProgressChars,
  } = $props()

  const handleGroups = () => {
    if (isAuthenticated) onShowProgressGroups()
  }
  const handleChars = () => {
    if (isAuthenticated) onShowProgressChars()
  }
</script>

<div class="anuka-row anuka-center">
  <Stat value={groupCount} label="Groups" onclick={handleGroups} />
  <Stat value={totalCount} label="Words" />
  <Stat value={uniqueWordCount} label="Unique" />
  <Stat value={uniqueChars} label="Chars" onclick={handleChars} />
  {#if isAuthenticated}
    <Stat value={strokeDrilledCount} label="Drilled" onclick={onShowProgressWords} />
    <Stat value={formatDuration(avgDailyTime)} label="Avg/Day" />
  {/if}
</div>
