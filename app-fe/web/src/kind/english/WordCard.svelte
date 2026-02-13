<script>
  import Island from '../../components/core/Island.svelte'
  import IslandTitle from '../../components/core/IslandTitle.svelte'
  import Quick from '../../components/core/Quick.svelte'
  import Tags from '../../components/core/Tags.svelte'

  let { item, onClose } = $props()
</script>

<div class="word-card" role="dialog" aria-modal="true">
  <Island>
    <Quick label="Close" icon="close" onclick={onClose} />
    <IslandTitle level={3}>{item.word}</IslandTitle>
    <p class="subtitle">{item.phonetics} · {item.russian}</p>
    <div class="anuka-stack">
      <div class="detail-row">
        <span class="detail-label">Word:</span>
        <span>{item.word}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Phonetics:</span>
        <span>{item.phonetics}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Translation:</span>
        <span>{item.russian}</span>
      </div>
      {#if item.tags && item.tags.length > 0}
        <div class="detail-row">
          <span class="detail-label">Tags:</span>
          <Tags tags={item.tags} />
        </div>
      {/if}
    </div>
  </Island>
</div>

<style>
  .word-card {
    max-width: min(900px, 96vw);
  }

  .subtitle {
    margin: 0;
    color: var(--anuka-color-muted);
  }

  .detail-row {
    display: flex;
    gap: 1rem;
    align-items: baseline;
  }

  .detail-label {
    font-weight: 600;
    color: var(--anuka-color-muted);
    min-width: 100px;
  }
</style>
