<script>
  let { item, onclick } = $props()
</script>

<button class="anuka-card anuka-stack anuka-compact" type="button" {onclick}>
  <div class="anuka-row anuka-justify">
    <span class="word">{item.word}</span>
    <span class="anuka-badge">{(item.id ?? 0).toString().padStart(2, '0')}</span>
  </div>
  <div class="phonetics">{item.phonetics}</div>
  <div class="anuka-mute">{item.russian}</div>
  <div class="anuka-row" style="flex-wrap: wrap; gap: 0.4rem;">
    {#each item.tags ?? [] as tag}
      <span class="anuka-tag">#{tag}</span>
    {/each}
  </div>
</button>

<style>
.word {
    font-size: 1.6rem;
    font-weight: 600;
  }

  .phonetics {
    color: var(--anuka-color-primary);
    font-weight: 600;
  }

</style>
