<script>
  import { tick } from 'svelte'
  import HanziWriter from 'hanzi-writer'

  let { item, onClose } = $props()

  const writers = new Map()
  const wordChars = $derived.by(() => (item ? item.word.split('') : []))
  const isHanChar = (char) => /[\u4e00-\u9fff]/.test(char)

  const animateChar = (idx) => {
    const writer = writers.get(idx)
    if (writer) writer.animateCharacter()
  }

  const initWriters = async () => {
    writers.forEach((writer) => writer?.cancelAnimation?.())
    writers.clear()
    await tick()
    wordChars.forEach((char, idx) => {
      const target = document.getElementById(`hanzi-${idx}`)
      if (!target || !isHanChar(char)) return
      const writer = HanziWriter.create(target, char, {
        width: 140,
        height: 140,
        padding: 8,
        showCharacter: true,
        strokeAnimationSpeed: 2,
        delayBetweenStrokes: 80,
      })
      writers.set(idx, writer)
    })
  }

  $effect(() => {
    if (item) {
      initWriters()
    }
    return () => {
      writers.forEach((writer) => writer?.cancelAnimation?.())
      writers.clear()
    }
  })
</script>

<div class="modal-card" role="dialog" aria-modal="true">
  <header class="modal-header">
    <div>
      <h3>{item.word}</h3>
      <p>{item.pinyin} · {item.english}</p>
    </div>
    <button class="close" type="button" onclick={onClose}>Close</button>
  </header>

  <div class="stroke-grid">
    {#each wordChars as char, idx}
      <div class="stroke-card">
        <div class="stroke-title">{char}</div>
        {#if isHanChar(char)}
          <div class="stroke-canvas" id={`hanzi-${idx}`}></div>
          <button class="stroke-btn" type="button" onclick={() => animateChar(idx)}>
            Animate
          </button>
        {:else}
          <div class="stroke-fallback">No stroke data</div>
        {/if}
      </div>
    {/each}
  </div>
</div>
