<script>
  import { sttDrill } from '@stt/kind/chinese/drill.svelte.js'
  import { svcDrill } from '@svc/kind/chinese/drill'
  import ProgressLine from '@std/ui/progress-line.svelte'
  import Btn from '@std/ui/btn.svelte'
  import BtnIcon from '@std/ui/btn-icon.svelte'

  $effect(() => {
    const _charIdx = sttDrill.charIndex
    const _item = sttDrill.currentItem
    if (sttDrill.currentChar) svcDrill.initStrokeQuiz()
    return () => svcDrill.destroyStrokeQuiz()
  })
</script>

<svelte:window onkeydown={(e) => { if (e.key === 'F1') { e.preventDefault(); svcDrill.toggleHint() } }} />

{#if sttDrill.currentItem}
  <div class="anuka-stack anuka-center">
    <div class="anuka-row anuka-center anuka-compact">
      <span>{sttDrill.currentItem.tr}</span>
      {#if sttDrill.showPinyin}
        <span class="anuka-mute">·</span>
        <button class="anuka-btn-link" type="button" translate="no" onclick={() => svcDrill.speak(sttDrill.currentItem.word)}>{sttDrill.currentItem.pinyin}</button>
      {/if}
    </div>

    <div class="anuka-row anuka-compact anuka-hanzi anuka-lg" translate="no" lang="zh">
      {#each sttDrill.hanChars as char, idx}
        {@const done = idx < sttDrill.charIndex || (idx === sttDrill.charIndex && sttDrill.wordDelay) || sttDrill.strokeQuizResult === 'correct'}
        <span class="anuka-tile" class:anuka-main={idx === sttDrill.charIndex || done}>
          {#if done}{char}{:else}&nbsp;{/if}
        </span>
      {/each}
    </div>

    <div class="anuka-frame" data-no-touch>
      <div id="drill-canvas"></div>
      {#if sttDrill.wordDelay}
        <ProgressLine class="anuka-sm" fill={sttDrill.wordDelayProgress}>
          {#snippet top()}<div class="anuka-row anuka-center"><button class="anuka-btn-link anuka-sm" type="button" onclick={() => svcDrill.skipDelay()}>Next</button></div>{/snippet}
        </ProgressLine>
      {/if}
    </div>

    {#if !sttDrill.strokeQuizResult || sttDrill.wordDelay}
      <div class="anuka-row anuka-center">
        <BtnIcon onclick={() => svcDrill.speak(sttDrill.currentItem.word)} label="Play audio">
          <span class="anuka-icon anuka-icon-speaker"></span>
        </BtnIcon>
        <Btn main={sttDrill.showPinyin} onclick={() => (sttDrill.showPinyin = !sttDrill.showPinyin)}>Pinyin</Btn>
        <Btn main={sttDrill.showHint} onclick={() => svcDrill.toggleHint()}>Hint</Btn>
        {#if sttDrill.wordDelay}
          <Btn onclick={() => svcDrill.repeatWord()}>Repeat</Btn>
        {:else}
          <Btn onclick={() => svcDrill.skipWord()}>Skip</Btn>
        {/if}
      </div>
    {/if}
  </div>
{/if}
