<script>
  let { item, strokeStat, pinyinStat, onclick } = $props()
</script>

<button class="anuka-card anuka-stack anuka-compact" type="button" {onclick}>
  <div class="anuka-row anuka-justify">
    <span class="anuka-lg anuka-hanzi">{item.word}</span>
    <span class="anuka-badge">{(item.id ?? 0).toString().padStart(2, '0')}</span>
  </div>
  <div class="anuka-main">{item.pinyin}</div>
  <div class="anuka-mute">{item.english}</div>
  <div class="anuka-row">
    {#each item.tags ?? [] as tag}
      <span class="anuka-tag">#{tag}</span>
    {/each}
    {#if strokeStat}
      <span class="anuka-sm anuka-main">{strokeStat.successCount}{#if strokeStat.errorCount > 0}<span class="anuka-fail">| {strokeStat.errorCount}</span>{/if}</span>
    {/if}
    {#if pinyinStat}
      <span class="anuka-sm anuka-main">{pinyinStat.successCount}{#if pinyinStat.errorCount > 0}<span class="anuka-fail">| {pinyinStat.errorCount}</span>{/if}</span>
    {/if}
  </div>
</button>
