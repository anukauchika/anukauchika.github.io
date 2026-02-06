<script>
  let { item, onClose } = $props()
</script>

<div class="modal-card" role="dialog" aria-modal="true">
  <header class="modal-header">
    <div>
      <h3>{item.word}</h3>
      <p>{item.phonetics} · {item.russian}</p>
    </div>
    <button class="page-close-btn" type="button" onclick={onClose} title="Close">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
    </button>
  </header>

  <div class="word-details">
    <div class="detail-row">
      <span class="detail-label">Word:</span>
      <span class="detail-value">{item.word}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Phonetics:</span>
      <span class="detail-value">{item.phonetics}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Translation:</span>
      <span class="detail-value">{item.russian}</span>
    </div>
    {#if item.tags && item.tags.length > 0}
      <div class="detail-row">
        <span class="detail-label">Tags:</span>
        <span class="detail-value">
          {#each item.tags as tag}
            <span class="tag">#{tag}</span>
          {/each}
        </span>
      </div>
    {/if}
  </div>
</div>

<style>
  .word-details {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .detail-row {
    display: flex;
    gap: 1rem;
    align-items: baseline;
  }

  .detail-label {
    font-weight: 600;
    color: var(--muted);
    min-width: 100px;
  }

  .detail-value {
    flex: 1;
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .tag {
    background: rgba(31, 111, 92, 0.08);
    padding: 0.2rem 0.5rem;
    border-radius: var(--radius-full);
    font-size: 0.85rem;
  }
</style>
