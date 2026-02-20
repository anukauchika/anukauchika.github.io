<script>
  import { tick } from 'svelte'
  import { sttDrill } from '@stt/kind/chinese/drill.svelte.js'
  import { svcDrill } from '@svc/kind/chinese/drill'
  import ProgressLine from '@std/ui/progress-line.svelte'
  import Btn from '@std/ui/btn.svelte'
  import BtnIcon from '@std/ui/btn-icon.svelte'

  let inputEl = $state(null)

  $effect(() => {
    const _ci = sttDrill.charIndex
    const _item = sttDrill.currentItem
    if (sttDrill.currentChar && !sttDrill.sessionDone && !sttDrill.wordDelay) {
      tick().then(() => inputEl?.focus())
    }
  })
</script>

<svelte:window onkeydown={(e) => { if (e.key === 'F1') { e.preventDefault(); svcDrill.toggleHint() } }} />

{#if sttDrill.currentItem}
  <div class="anuka-stack">
    <div class="anuka-row anuka-center anuka-compact" class:anuka-hidden={!sttDrill.showTranslation}>
      <span>{sttDrill.currentItem.tr}</span>
    </div>

    <div class="anuka-row anuka-center anuka-compact" translate="no" lang="zh">
      {#each sttDrill.hanChars as char, idx}
        {@const done = sttDrill.charDoneMap.has(idx) || sttDrill.wordDelay}
        {@const active = idx === sttDrill.charIndex && !sttDrill.wordDelay}
        <div class="anuka-stack anuka-center anuka-compact">
          <span class="anuka-hanzi anuka-tile anuka-lg" class:anuka-main={done} class:anuka-mute={!done && !active}>
            {char}
          </span>
          {#if sttDrill.charDoneMap.has(idx)}
            <span class="anuka-main">{sttDrill.charDoneMap.get(idx)}</span>
          {:else if active}
            <span class="anuka-main">
              {#if sttDrill.showHint}{sttDrill.pinyinSlots[sttDrill.charIndex]?.pinyin ?? ''}{:else}?{/if}
            </span>
          {:else}
            <span class="anuka-hidden">&nbsp;</span>
          {/if}
        </div>
      {/each}
    </div>

    <div class="anuka-row anuka-center anuka-compact">
      {#if sttDrill.wordDelay}
        <ProgressLine class="anuka-sm" fill={sttDrill.wordDelayProgress}>
          {#snippet top()}<div class="anuka-row anuka-center">
              <button class="anuka-btn-link anuka-sm" type="button" onclick={() => svcDrill.skipDelay()}>Next</button>
            </div>{/snippet}
        </ProgressLine>
      {:else}
        <input
          bind:this={inputEl}
          bind:value={sttDrill.pinyinInputValue}
          oninput={() => svcDrill.submitPinyinInput()}
          type="text"
          class="anuka-input anuka-lg"
          class:anuka-fail={sttDrill.pinyinFeedback === 'fail'}
          disabled={sttDrill.wordDelay}
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          placeholder="pinyin (ex: lao3, shi1)"
        />
      {/if}
    </div>

    <div class="anuka-row anuka-center">
      <BtnIcon onclick={() => svcDrill.speak(sttDrill.currentItem.word)} label="Play audio">
        <span class="anuka-icon anuka-icon-speaker"></span>
      </BtnIcon>
      <Btn disabled={sttDrill.wordDelay} main={sttDrill.showTranslation} onclick={() => (sttDrill.showTranslation = !sttDrill.showTranslation)}>Tr</Btn>
      <Btn disabled={sttDrill.wordDelay} main={sttDrill.showHint} onclick={() => svcDrill.toggleHint()}>Hint</Btn>
      <Btn disabled={sttDrill.wordDelay} onclick={() => svcDrill.skipWord()}>Skip</Btn>
    </div>
  </div>
{/if}
