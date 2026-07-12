<script>
  import { untrack } from 'svelte'
  import { DrillStrokeSession } from './drill-stroke.svelte.js'
  import Island from '@std/ui/island.svelte'
  import ProgressLine from '@std/ui/progress-line.svelte'
  import Tags from '@std/ui/tags.svelte'
  import Btn from '@std/ui/btn.svelte'
  import BtnIcon from '@std/ui/btn-icon.svelte'

  let {
    group,
    items,
    wordProgress,
    groupProgressStroke,
    groupProgressPinyin,
    backUrl,
    authenticated,
    showIntro = false,
    onSignIn,
    onWordDone,
    onDrillDone,
  } = $props()

  // svelte-ignore state_referenced_locally
  const session = new DrillStrokeSession({ items, wordProgress, onWordDone, onDrillDone })

  $effect(() => {
    const _charIdx = session.charIndex
    const _quizKey = session.quizKey
    const _item = session.currentItem
    if (session.currentChar) untrack(() => session.initStrokeQuiz())
    return () => session.destroyStrokeQuiz()
  })

  $effect(() => {
    return () => session.destroy()
  })
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === 'F1') {
      e.preventDefault()
      session.toggleHint()
    }
  }}
/>

{#if session.sessionSaving}
  <Island>
    <div class="anuka-stack anuka-center anuka-compact">
      <h2 class="anuka-island-title anuka-main">Saving session</h2>
      <div class="anuka-mute anuka-sm">{session.drilledCount} drilled &middot; {session.skippedCount} skipped</div>
    </div>
  </Island>
{:else if session.currentItem && !session.sessionDone}
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

    <div class="anuka-stack anuka-center">
      <div class="anuka-row anuka-center anuka-compact">
        <span>{session.currentItem.tr}</span>
        {#if session.showPinyin}
          <span class="anuka-mute">·</span>
          <button
            class="anuka-btn-link"
            type="button"
            translate="no"
            onclick={() => session.speak(session.currentItem.word)}>{session.currentItem.pinyin}</button
          >
        {/if}
      </div>

      <div class="anuka-row anuka-compact anuka-hanzi anuka-lg" translate="no" lang="zh-CN">
        {#each session.hanChars as char, idx}
          {@const done =
            idx < session.charIndex ||
            (idx === session.charIndex && session.wordDelay) ||
            session.strokeQuizResult === 'correct'}
          <span class="anuka-tile anuka-lg" class:anuka-main={idx === session.charIndex || done}>
            {#if done}{char}{:else}&nbsp;{/if}
          </span>
        {/each}
      </div>

      {#if showIntro}
        <p class="anuka-mute anuka-sm">Trace the strokes in the box below — stroke order matters</p>
      {/if}

      <div class="anuka-frame" data-no-touch>
        <div id="drill-canvas"></div>
        <svg class="accepted-strokes" viewBox="0 0 280 280" aria-hidden="true">
          {#each session.acceptedStrokePaths as path, index (index)}
            <path d={path}></path>
          {/each}
        </svg>
        {#if session.wordDelay}
          <ProgressLine class="anuka-sm" fill={session.wordDelayProgress}>
            {#snippet top()}<div class="anuka-row anuka-center">
                <button class="anuka-btn-link anuka-sm" type="button" onclick={() => session.skipDelay()}>Next</button>
              </div>{/snippet}
          </ProgressLine>
        {/if}
      </div>

      {#if !session.strokeQuizResult || session.wordDelay || session.waitingForNext}
        <div class="anuka-row anuka-center">
          <BtnIcon onclick={() => session.speak(session.currentItem.word)} label="Play audio">
            <span class="anuka-icon anuka-icon-speaker"></span>
          </BtnIcon>
          <Btn main={session.showPinyin} onclick={() => (session.showPinyin = !session.showPinyin)}>Pinyin</Btn>
          <Btn main={session.showHint} onclick={() => session.toggleHint()}>Hint</Btn>
          {#if session.wordDelay || session.waitingForNext}
            <Btn onclick={() => session.repeatWord()}>Repeat</Btn>
          {:else}
            <Btn onclick={() => session.skipWord()}>Skip</Btn>
          {/if}
          {#if session.waitingForNext}
            <Btn main onclick={() => session.advanceFromNext()}>Next</Btn>
          {/if}
        </div>
      {/if}
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
      {#if !authenticated}
        <div class="anon-session-notice anuka-mute">
          <p>The session won't be saved.</p>
          <p>Get all 67 HSK Elementary lessons free, with smart repetition and stats.</p>
        </div>
        <Btn main onclick={onSignIn}>Sign in</Btn>
      {:else}
        <Btn main onclick={() => session.restart()}>Restart</Btn>
      {/if}
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
    <h1>Practice Writing</h1>
  </div>
  {#if group}
    <div class="anuka-row anuka-center">
      <span class="anuka-sm anuka-mute">{group.displayId}</span>
      {#if group.tags?.length}
        <Tags tags={group.tags} />
      {/if}
      <span class="anuka-sm anuka-mute">{group.items.length} words</span>
      {#if authenticated}
        <span class="anuka-sm anuka-main"
          >W {groupProgressStroke?.clean ?? 0} | P {groupProgressPinyin?.clean ?? 0}</span
        >
      {/if}
    </div>
  {/if}
</Island>

<style>
  .accepted-strokes {
    position: absolute;
    inset: 0;
    width: 280px;
    height: 280px;
    pointer-events: none;
    color: var(--anuka-color-text);
  }

  .accepted-strokes path {
    fill: none;
    stroke: currentColor;
    stroke-width: 10;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .anon-session-notice {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    margin: 0.8rem 0;
    font-size: 1.1rem;
    line-height: 1.45;
  }

  .anon-session-notice p {
    margin: 0;
  }
</style>
