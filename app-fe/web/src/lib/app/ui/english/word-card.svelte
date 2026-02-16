<script>
  import Island from '@std/ui/island.svelte'
  import IslandTitle from '@std/ui/island-title.svelte'
  import Quick from '@std/ui/quick.svelte'
  import Tags from '@std/ui/tags.svelte'

  let { item, onClose } = $props()
</script>

<div role="dialog" aria-modal="true">
  <Island>
    <Quick label="Close" icon="close" onclick={onClose} />
    <IslandTitle level={3}>{item.word}</IslandTitle>
    <div class="anuka-mute">{item.phonetics} · {item.russian}</div>
    <div class="anuka-stack">
      <div class="anuka-row">
        <span class="anuka-mute">Word:</span>
        <span>{item.word}</span>
      </div>
      <div class="anuka-row">
        <span class="anuka-mute">Phonetics:</span>
        <span>{item.phonetics}</span>
      </div>
      <div class="anuka-row">
        <span class="anuka-mute">Translation:</span>
        <span>{item.russian}</span>
      </div>
      {#if item.tags && item.tags.length > 0}
        <div class="anuka-row">
          <span class="anuka-mute">Tags:</span>
          <Tags tags={item.tags} />
        </div>
      {/if}
    </div>
  </Island>
</div>
