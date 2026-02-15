<script>
  import { timeAgo } from '../../utils/format.js'
  import Island from '../core/Island.svelte'
  import IslandTitle from '../core/IslandTitle.svelte'
  import BtnIcon from '../core/BtnIcon.svelte'
  import PracticeChart from './PracticeChart.svelte'

  let {
    items,
    chartData,
    practicedCount,
    totalCount,
    onclose,
    itemSnippet,
  } = $props()
</script>

<Island sticky>
  <div class="anuka-row anuka-justify">
    <IslandTitle level={3}>Unique Words Practiced <span class="anuka-main">{practicedCount}</span> | {totalCount}</IslandTitle>
    <BtnIcon icon="close" label="Close" onclick={onclose} />
  </div>
</Island>
<section class="anuka-stack">
  {#if chartData}
    <PracticeChart bars={chartData.bars} line={chartData.cumulativeData} ticks={chartData.ticks} yMax={chartData.yMax} />
  {/if}
  <div class="anuka-grid">
    {#each items as entry (`${entry.group.group}-${entry.item.id}`)}
      <div class="anuka-stack anuka-compact">
        <span class="anuka-mute anuka-sm">{timeAgo(entry.stat.lastPracticedAt)}</span>
        {@render itemSnippet(entry)}
      </div>
    {/each}
  </div>
</section>
