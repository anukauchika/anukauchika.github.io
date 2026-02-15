<script>
  let { item, onclick } = $props()
</script>

<button class="anuka-card anuka-stack anuka-compact" type="button" {onclick}>
  <div class="anuka-row anuka-justify">
    <span class="anuka-lg">{item.word}</span>
    <span class="anuka-badge">{(item.id ?? 0).toString().padStart(2, '0')}</span>
  </div>
  <div class="anuka-main">{item.phonetics}</div>
  <div class="anuka-mute">{item.russian}</div>
  <div class="anuka-row">
    {#each item.tags ?? [] as tag}
      <span class="anuka-tag">#{tag}</span>
    {/each}
  </div>
</button>
