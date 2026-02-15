<script>
  let { item, strokeStat, pinyinStat, onclick } = $props()
</script>

<button class="anuka-card anuka-stack anuka-compact" type="button" {onclick}>
  <div class="anuka-row anuka-justify">
    <span class="hanzi">{item.word}</span>
    <span class="anuka-badge">{(item.id ?? 0).toString().padStart(2, '0')}</span>
  </div>
  <div class="pinyin">{item.pinyin}</div>
  <div class="anuka-mute">{item.english}</div>
  <div class="anuka-row" style="flex-wrap: wrap; gap: 0.4rem;">
    {#each item.tags ?? [] as tag}
      <span class="anuka-tag">#{tag}</span>
    {/each}
    {#if strokeStat}
      <span class="stat-stroke">{strokeStat.successCount}{#if strokeStat.errorCount > 0}<span class="anuka-fail" style="margin-left: 0.25em;">| {strokeStat.errorCount}</span>{/if}</span>
    {/if}
    {#if pinyinStat}
      <span class="stat-pinyin">{pinyinStat.successCount}{#if pinyinStat.errorCount > 0}<span class="anuka-fail" style="margin-left: 0.25em;">| {pinyinStat.errorCount}</span>{/if}</span>
    {/if}
  </div>
</button>

<style>
.hanzi {
    font-size: 1.6rem;
    font-weight: 600;
    font-family: var(--font-chinese);
  }

  .pinyin {
    color: var(--anuka-color-primary);
    font-weight: 600;
  }

  .stat-stroke {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--anuka-color-primary);
    margin-left: auto;
  }

  .stat-pinyin {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--anuka-color-primary);
  }

  .stat-stroke + .stat-pinyin {
    margin-left: 0.5em;
  }

  .stat-pinyin:not(.stat-stroke + .stat-pinyin) {
    margin-left: auto;
  }

</style>
