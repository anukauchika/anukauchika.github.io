<script>
  import { timeAgo } from '@std/format.js'
  import Island from '@std/ui/island.svelte'
  import IslandTitle from '@std/ui/island-title.svelte'
  import BtnIcon from '@std/ui/btn-icon.svelte'
  import ProgressChart from '@uic/progress-chart.svelte'

  let {
    items,
    chartData,
    drilledCount,
    totalCount,
    onclose,
    itemSnippet,
  } = $props()
</script>

<Island sticky>
  <div class="anuka-row anuka-justify">
    <IslandTitle level={3}>Unique Words Drilled <span class="anuka-main">{drilledCount}</span> | {totalCount}</IslandTitle>
    <BtnIcon icon="close" label="Close" onclick={onclose} />
  </div>
</Island>
<section class="anuka-stack">
  {#if chartData}
    <ProgressChart bars={chartData.bars} line={chartData.cumulativeData} ticks={chartData.ticks} yMax={chartData.yMax} />
  {/if}
  <div class="anuka-grid">
    {#each items as entry (`${entry.group.id}-${entry.item.id}`)}
      <div class="anuka-stack anuka-compact">
        <span class="anuka-mute anuka-sm">{timeAgo(entry.stat.lastDrilledAt)}</span>
        {@render itemSnippet(entry)}
      </div>
    {/each}
  </div>
</section>
