<script>
  import Island from '@std/ui/island.svelte'
</script>

<Island>
  <div class="icon-preview" aria-label="App icon preview">
    {#each ['large', 'medium', 'small'] as size}
      <img class={`app-icon ${size}`} src="/favicon.svg" alt="Anuka Uchika app icon" />
    {/each}
  </div>
</Island>

<style>
  .icon-preview {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  .app-icon {
    display: block;
    flex: 0 0 auto;
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.16);
  }

  .large {
    width: 128px;
    height: 128px;
  }

  .medium {
    width: 96px;
    height: 96px;
  }

  .small {
    width: 48px;
    height: 48px;
  }
</style>
