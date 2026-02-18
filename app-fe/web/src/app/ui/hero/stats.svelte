<script>
  import Stat from '@std/ui/stat.svelte'

  let {
    groupCount,
    totalCount,
    uniqueChars,
    strokePracticedCount,
    isAuthenticated,
    onShowPracticedGroups,
    onShowPracticedList,
    onShowPracticedChars,
  } = $props()

  const handleGroups = () => {
    if (isAuthenticated) onShowPracticedGroups()
  }
  const handleChars = () => {
    if (isAuthenticated) onShowPracticedChars()
  }
</script>

<div class="anuka-row anuka-justify">
  <Stat value={groupCount} label="Groups" onclick={handleGroups} />
  <Stat value={totalCount} label="Words" />
  <Stat value={uniqueChars} label="Chars" onclick={handleChars} />
  {#if isAuthenticated}
    <Stat value={strokePracticedCount} label="Practiced" onclick={onShowPracticedList} />
  {/if}
</div>
