<script>
  import { tick } from 'svelte'
  import HanziWriter from 'hanzi-writer'
  import Island from '../../components/core/Island.svelte'
  import IslandTitle from '../../components/core/IslandTitle.svelte'
  import Quick from '../../components/core/Quick.svelte'
  import Card from '../../components/core/Card.svelte'
  import Btn from '../../components/core/Btn.svelte'

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

<div class="word-card" role="dialog" aria-modal="true">
  <Island>
    <Quick label="Close" icon="close" onclick={onClose} />
    <IslandTitle level={3}>{item.word}
      <button type="button" class="speak-btn" onclick={speak} title="Pronounce">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
      </button>
    </IslandTitle>
    <p class="subtitle">{item.pinyin} · {item.english}</p>
    <div class="stroke-grid" style="--stroke-cols: {wordChars.length}">
      {#each wordChars as char, idx}
        <Card>
          <div class="anuka-stack" style="align-items: center;">
            {#if isHanChar(char)}
              <div class="stroke-canvas" id={`hanzi-${idx}`}></div>
              <Btn onclick={() => animateChar(idx)}>Animate</Btn>
            {:else}
              <div class="stroke-fallback">No stroke data</div>
            {/if}
          </div>
        </Card>
      {/each}
    </div>
  </Island>
</div>

<style>
  .word-card {
    width: fit-content;
    max-width: min(900px, 96vw);
  }

  .subtitle {
    margin: 0;
    color: var(--anuka-color-muted);
  }

  .speak-btn {
    display: inline-flex;
    align-items: center;
    background: none;
    border: none;
    padding: 0.2rem;
    border-radius: 6px;
    color: var(--anuka-color-muted);
    cursor: pointer;
    vertical-align: middle;
    transition: color 0.15s ease;
  }

  .speak-btn:hover {
    color: var(--anuka-color-primary);
  }

  .stroke-grid {
    display: grid;
    grid-template-columns: repeat(var(--stroke-cols, 1), 180px);
    gap: 1.2rem;
    justify-content: center;
  }

  @media (max-width: 600px) {
    .stroke-grid {
      grid-template-columns: repeat(auto-fill, 180px);
    }
  }

  .stroke-canvas {
    width: 140px;
    height: 140px;
    background: var(--anuka-color-border);
    border-radius: 12px;
  }

  .stroke-fallback {
    height: 140px;
    display: grid;
    place-items: center;
    color: var(--anuka-color-muted);
    font-size: 0.85rem;
    background: var(--anuka-color-border);
    border-radius: 12px;
  }
</style>
