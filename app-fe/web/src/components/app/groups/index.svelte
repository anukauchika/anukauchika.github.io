<script>
  import Island from '../../core/Island.svelte'
  import BtnLink from '../../core/BtnLink.svelte'
  import FullGroup from './FullGroup.svelte'

  let {
    groups,
    viewStyle = 'full',
    hasSearch = false,
    datasetId,
    compact,
  } = $props()

  let showAllGroups = $state(false)

  $effect(() => { datasetId; showAllGroups = false })

  const MAX_MAIN_GROUPS = 10
  const isLimited = $derived.by(() => !hasSearch && !showAllGroups && groups.length > MAX_MAIN_GROUPS)
  const visibleGroups = $derived.by(() =>
    hasSearch || showAllGroups ? groups : groups.slice(0, MAX_MAIN_GROUPS)
  )
</script>

<div class="anuka-stack">
  {#if groups.length === 0}
    <Island>
      <p>No matches. Try clearing filters or searching a different term.</p>
    </Island>
  {:else if viewStyle === 'compact'}
    {@render compact()}
  {:else}
    {#each visibleGroups as group (group.groupId)}
      <FullGroup {...group} />
    {/each}
    {#if isLimited}
      <div class="anuka-row anuka-center">
        <BtnLink onclick={() => showAllGroups = true}>Show all {groups.length} groups</BtnLink>
      </div>
    {/if}
  {/if}
</div>
