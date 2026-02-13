<script>
  let { item, onclick } = $props()
</script>

<button class="anuka-card group-item" type="button" {onclick}>
  <div class="anuka-row anuka-justify">
    <span class="word">{item.word}</span>
    <span class="item-id">{(item.id ?? 0).toString().padStart(2, '0')}</span>
  </div>
  <div class="phonetics">{item.phonetics}</div>
  <div class="translation">{item.russian}</div>
  <div class="anuka-row" style="flex-wrap: wrap; gap: 0.4rem;">
    {#each item.tags ?? [] as tag}
      <span class="anuka-tag">#{tag}</span>
    {/each}
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

  .word {
    font-size: 1.6rem;
    font-weight: 600;
  }

  .item-id {
    background: var(--anuka-color-border);
    color: var(--anuka-color-muted);
    padding: 0.2rem 0.5rem;
    border-radius: 8px;
    font-size: 0.75rem;
  }

  .phonetics {
    color: var(--anuka-color-primary);
    font-weight: 600;
  }

  .translation {
    color: var(--anuka-color-muted);
  }
</style>
