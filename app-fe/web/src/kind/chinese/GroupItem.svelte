<script>
  let { item, stat, onclick } = $props()
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
  </div>
  {#if stat}
    <div class="success-count">{stat.successCount}x</div>
  {/if}
</button>
