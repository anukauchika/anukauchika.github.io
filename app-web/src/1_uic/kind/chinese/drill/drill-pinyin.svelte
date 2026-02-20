<script>
  import { tick } from 'svelte'
  import { DrillPinyinSession } from './drill-pinyin.svelte.js'
  import Island from '@std/ui/island.svelte'
  import ProgressLine from '@std/ui/progress-line.svelte'
  import Tags from '@std/ui/tags.svelte'
  import Btn from '@std/ui/btn.svelte'
  import BtnIcon from '@std/ui/btn-icon.svelte'

  let { group, items, wordProgress, groupProgress, backUrl,
        authenticated, onWordDone, onDrillDone } = $props()

  // svelte-ignore state_referenced_locally
  const session = new DrillPinyinSession({ items, wordProgress, onWordDone, onDrillDone })

  let inputEl = $state(null)

  $effect(() => {
    const _ci = session.charIndex
    const _item = session.currentItem
    if (session.currentChar && !session.sessionDone && !session.wordDelay) {
      tick().then(() => inputEl?.focus())
    }
  })

  $effect(() => {
    return () => session.destroy()
  })
</script>

<svelte:window onkeydown={(e) => { if (e.key === 'F1') { e.preventDefault(); session.toggleHint() } }} />

{#if session.currentItem && !session.sessionDone}
  <Island>
    <a class="anuka-quick" href={backUrl} title="Back">
      <span class="anuka-icon anuka-icon-close"></span>
    </a>
    {#if authenticated && session.currentStat}
      <span class="anuka-quick anuka-left anuka-badge anuka-main">
        {session.currentStat.successCount}
        {#if session.currentStat.errorCount > 0}
          <span class="anuka-fail">| {session.currentStat.errorCount}</span>
        {/if}
        {#if session.currentStat.hintCount > 0}
          <span class="anuka-warn">| {session.currentStat.hintCount}</span>
        {/if}
      </span>
    {/if}

    <div class="anuka-stack">
      <div class="anuka-row anuka-center anuka-compact" class:anuka-hidden={!session.showTranslation}>
        <span>{session.currentItem.tr}</span>
      </div>

      <div class="anuka-row anuka-center anuka-compact" translate="no" lang="zh">
        {#each session.hanChars as char, idx}
          {@const done = session.charDoneMap.has(idx) || session.wordDelay}
          {@const active = idx === session.charIndex && !session.wordDelay}
          <div class="anuka-stack anuka-center anuka-compact">
            <span class="anuka-hanzi anuka-tile anuka-lg" class:anuka-main={done} class:anuka-mute={!done && !active}>
              {char}
            </span>
            {#if session.charDoneMap.has(idx)}
              <span class="anuka-main">{session.charDoneMap.get(idx) || '\u00A0'}</span>
            {:else if active}
              <span class="anuka-main">
                {#if session.showHint}{session.pinyinSlots[session.charIndex]?.pinyin ?? ''}{:else}?{/if}
              </span>
            {:else}
              <span class="anuka-hidden">&nbsp;</span>
            {/if}
          </div>
        {/each}
      </div>

      <div class="anuka-attach anuka-row anuka-center">
        <input
          bind:this={inputEl}
          bind:value={session.pinyinInputValue}
          oninput={() => session.submitInput()}
          type="text"
          class="anuka-input anuka-lg"
          class:anuka-fail={session.pinyinFeedback === 'fail'}
          class:anuka-hidden={session.wordDelay}
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          placeholder="pinyin (ex: lao3, shi1)"
        />
        {#if session.wordDelay}
          <ProgressLine class="anuka-sm" fill={session.wordDelayProgress}>
            {#snippet top()}<div class="anuka-row anuka-center">
                <button class="anuka-btn-link anuka-sm" type="button" onclick={() => session.skipDelay()}>Next</button>
              </div>{/snippet}
          </ProgressLine>
        {/if}
      </div>

      <div class="anuka-row anuka-center">
        <BtnIcon onclick={() => session.speak(session.currentItem.word)} label="Play audio">
          <span class="anuka-icon anuka-icon-speaker"></span>
        </BtnIcon>
        <Btn disabled={session.wordDelay} main={session.showTranslation} onclick={() => (session.showTranslation = !session.showTranslation)}>Tr</Btn>
        <Btn disabled={session.wordDelay} main={session.showHint} onclick={() => session.toggleHint()}>Hint</Btn>
        <Btn disabled={session.wordDelay} onclick={() => session.skipWord()}>Skip</Btn>
      </div>
    </div>
  </Island>
{/if}

{#if session.sessionDone}
  <Island>
    <a class="anuka-quick" href={backUrl} title="Back">
      <span class="anuka-icon anuka-icon-close"></span>
    </a>
    <div class="anuka-stack anuka-center anuka-compact">
      <h2 class="anuka-island-title anuka-main">Session complete</h2>
      <div class="anuka-mute anuka-sm">{session.drilledCount} drilled &middot; {session.skippedCount} skipped</div>
      <Btn main onclick={() => session.restart()}>Restart</Btn>
      <Btn onclick={() => (window.location.href = backUrl)}>Groups</Btn>
    </div>
  </Island>
{/if}

<ProgressLine fill={session.progress}>
  {#snippet bottom()}<div class="anuka-row anuka-center">
      <span class="anuka-mute anuka-sm">{session.currentIndex + 1} / {session.items.length}</span>
    </div>{/snippet}
</ProgressLine>

<div class="anuka-tags anuka-center">
  {#each session.items as item, idx}
    {@const stat = session.wordProgress.get(item.id)}
    <span
      class="anuka-tag"
      class:anuka-main={idx === session.currentIndex}
      class:anuka-succ={session.completedWords.has(idx)}
      title={item.word}
    >
      {item.tr}
      {#if authenticated && stat}
        <span class="anuka-sm">{stat.successCount}</span>
        {#if stat.errorCount > 0}
          <span class="anuka-sm anuka-fail">| {stat.errorCount}</span>
        {/if}
        {#if stat.hintCount > 0}
          <span class="anuka-sm anuka-warn">| {stat.hintCount}</span>
        {/if}
      {/if}
    </span>
  {/each}
</div>

<Island>
  <div class="anuka-row anuka-center">
    <h1>Practice Pinyin</h1>
  </div>
  {#if group}
    <div class="anuka-row anuka-center">
      <span class="anuka-sm anuka-mute">{group.displayId}</span>
      {#if group.tags?.length}
        <Tags tags={group.tags} />
      {/if}
      <span class="anuka-sm anuka-mute">{group.items.length} words</span>
      {#if authenticated && groupProgress}
        <span class="anuka-sm anuka-main">{groupProgress.total} passes ({groupProgress.full} full)</span>
      {/if}
    </div>
  {/if}
</Island>
