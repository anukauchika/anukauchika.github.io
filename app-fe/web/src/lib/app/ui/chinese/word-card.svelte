<script>
  import { tick } from 'svelte'
  import HanziWriter from 'hanzi-writer'
  import Island from '@std/ui/island.svelte'
  import IslandTitle from '@std/ui/island-title.svelte'
  import Quick from '@std/ui/quick.svelte'
  import Card from '@std/ui/card.svelte'
  import Btn from '@std/ui/btn.svelte'
  import BtnIcon from '@std/ui/btn-icon.svelte'

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

<div role="dialog" aria-modal="true">
  <Island>
    <Quick label="Close" icon="close" onclick={onClose} />
    <div class="anuka-row">
      <IslandTitle level={3}>{item.word}</IslandTitle>
      <BtnIcon onclick={speak} label="Pronounce">
        <span class="anuka-icon anuka-icon-speaker"></span>
      </BtnIcon>
    </div>
    <div class="anuka-mute">{item.pinyin} · {item.english}</div>
    <div class="anuka-grid">
      {#each wordChars as char, idx}
        <Card>
          <div class="anuka-stack anuka-center">
            {#if isHanChar(char)}
              <div class="anuka-frame anuka-sm" id={`hanzi-${idx}`}></div>
              <Btn main onclick={() => animateChar(idx)}>Animate</Btn>
            {:else}
              <div class="anuka-frame anuka-sm anuka-mute">
                <span class="anuka-sm">No stroke data</span>
              </div>
            {/if}
          </div>
        </Card>
      {/each}
    </div>
  </Island>
</div>
