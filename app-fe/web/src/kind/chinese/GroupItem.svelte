<script>
  let { item, strokeStat, pinyinStat, onclick } = $props()
</script>

<button class="word-card" type="button" {onclick}>
  <div class="word-top">
    <span class="hanzi">{item.word}</span>
    <span class="id">{(item.id ?? 0).toString().padStart(2, '0')}</span>
  </div>
  <div class="pinyin">{item.pinyin}</div>
  <div class="english">{item.english}</div>
  <div class="word-tags">
    {#each item.tags ?? [] as tag}
      <span>#{tag}</span>
    {/each}
    {#if strokeStat}
      <span class="success-count">{strokeStat.successCount}{#if strokeStat.errorCount > 0}<span class="error-count">| {strokeStat.errorCount}</span>{/if}</span>
    {/if}
    {#if pinyinStat}
      <span class="success-count-pinyin">{pinyinStat.successCount}{#if pinyinStat.errorCount > 0}<span class="error-count">| {pinyinStat.errorCount}</span>{/if}</span>
    {/if}
  </div>
</button>
