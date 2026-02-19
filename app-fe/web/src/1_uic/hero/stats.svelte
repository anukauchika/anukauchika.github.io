<script>
  import Stat from '@std/ui/stat.svelte'

  let {
    groupCount,
    totalCount,
    uniqueChars,
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

<div class="anuka-row anuka-justify">
  <Stat value={groupCount} label="Groups" onclick={handleGroups} />
  <Stat value={totalCount} label="Words" />
  <Stat value={uniqueChars} label="Chars" onclick={handleChars} />
  {#if isAuthenticated}
    <Stat value={strokeDrilledCount} label="Drilled" onclick={onShowProgressWords} />
  {/if}
</div>
