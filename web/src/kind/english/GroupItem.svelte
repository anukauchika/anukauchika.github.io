<script>
  let { item, onclick } = $props()
</script>

<button class="word-card" type="button" {onclick}>
  <div class="word-top">
    <span class="hanzi">{item.word}</span>
    <span class="id">{(item.id ?? 0).toString().padStart(2, '0')}</span>
  </div>
  <div class="pinyin">{item.phonetics}</div>
  <div class="english">{item.russian}</div>
  <div class="word-tags">
    {#each item.tags ?? [] as tag}
      <span>#{tag}</span>
    {/each}
  </div>
</button>
