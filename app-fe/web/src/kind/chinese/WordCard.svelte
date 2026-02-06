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

  const speak = () => {
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(item.word)
    u.lang = 'zh-CN'
    u.rate = 0.8
    speechSynthesis.speak(u)
  }

  $effect(() => {
    if (item) {
      initWriters()
    }
    return () => {
      writers.forEach((writer) => writer?.cancelAnimation?.())
      writers.clear()
      speechSynthesis.cancel()
    }
  })
</script>

<div class="modal-card" role="dialog" aria-modal="true">
  <header class="modal-header">
    <div>
      <h3>{item.word} <button type="button" class="speak-btn" onclick={speak} title="Pronounce"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg></button></h3>
      <p>{item.pinyin} · {item.english}</p>
    </div>
    <button class="page-close-btn" type="button" onclick={onClose}>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
    </button>
  </header>

  <div class="stroke-grid" style="--stroke-cols: {wordChars.length}">
    {#each wordChars as char, idx}
      <div class="stroke-card">
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
