<script>
  let { item, strokeStat, pinyinStat, onclick } = $props()
</script>

<button class="anuka-card group-item" type="button" {onclick}>
  <div class="anuka-row anuka-justify">
    <span class="hanzi">{item.word}</span>
    <span class="item-id">{(item.id ?? 0).toString().padStart(2, '0')}</span>
  </div>
  <div class="pinyin">{item.pinyin}</div>
  <div class="english">{item.english}</div>
  <div class="anuka-row" style="flex-wrap: wrap; gap: 0.4rem;">
    {#each item.tags ?? [] as tag}
      <span class="anuka-tag">#{tag}</span>
    {/each}
    {#if strokeStat}
      <span class="stat-stroke">{strokeStat.successCount}{#if strokeStat.errorCount > 0}<span class="stat-error">| {strokeStat.errorCount}</span>{/if}</span>
    {/if}
    {#if pinyinStat}
      <span class="stat-pinyin">{pinyinStat.successCount}{#if pinyinStat.errorCount > 0}<span class="stat-error">| {pinyinStat.errorCount}</span>{/if}</span>
    {/if}
  </div>
</button>

<style>
  .group-item {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    text-align: left;
    cursor: pointer;
    font-family: inherit;
    font-size: inherit;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .group-item:hover {
    transform: translateY(-4px);
    box-shadow: 0 14px 30px var(--anuka-color-shadow);
  }

  .group-item:focus-visible {
    outline: 3px solid var(--anuka-color-accent);
    outline-offset: 3px;
  }

  .hanzi {
    font-size: 1.6rem;
    font-weight: 600;
    font-family: var(--font-chinese);
  }

  .item-id {
    background: var(--anuka-color-border);
    color: var(--anuka-color-muted);
    padding: 0.2rem 0.5rem;
    border-radius: 8px;
    font-size: 0.75rem;
  }

  .pinyin {
    color: var(--anuka-color-primary);
    font-weight: 600;
  }

  .english {
    color: var(--anuka-color-muted);
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

  .stat-error {
    color: #b85450;
    margin-left: 0.25em;
  }
</style>
