<script>
  let { item, strokeStat, pinyinStat, onclick } = $props()
</script>

<button class="anuka-card anuka-stack" type="button" {onclick}>
  <div class="anuka-row anuka-right anuka-compact">
    {#if strokeStat}
      <span class="anuka-sm anuka-main">W {strokeStat.successCount}</span>
      {#if strokeStat.errorCount > 0}
        <span class="anuka-sm anuka-fail">| {strokeStat.errorCount}</span>
      {/if}
    {/if}
    {#if pinyinStat}
      <span class="anuka-sm anuka-main">P {pinyinStat.successCount}</span>
      {#if pinyinStat.errorCount > 0}
        <span class="anuka-sm anuka-fail">| {pinyinStat.errorCount}</span>
      {/if}
    {/if}
    <span class="anuka-badge">{(item.id ?? 0).toString().padStart(2, '0')}</span>
  </div>
  <div class="anuka-row anuka-justify">
    <span class="anuka-lg anuka-hanzi">{item.word}</span>
  </div>
  <div class="anuka-row">
    <span class="anuka-main">{item.pinyin}</span>
    <span class="anuka-mute">{item.tr}</span>
  </div>
  <div class="anuka-row anuka-compact">
    {#each item.tags ?? [] as tag}
      <span class="anuka-tag">#{tag}</span>
    {/each}
  </div>
</button>
