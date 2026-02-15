<script>
  import Island from '../../components/core/Island.svelte'
  import IslandTitle from '../../components/core/IslandTitle.svelte'
  import Quick from '../../components/core/Quick.svelte'
  import Tags from '../../components/core/Tags.svelte'

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
