<script>
  import { DrillStrokeSession } from './drill-stroke.svelte.js'
  import Island from '@std/ui/island.svelte'
  import ProgressLine from '@std/ui/progress-line.svelte'
  import Tags from '@std/ui/tags.svelte'
  import Btn from '@std/ui/btn.svelte'
  import BtnIcon from '@std/ui/btn-icon.svelte'

  let { group, items, wordProgress, groupProgress, backUrl,
        authenticated, onWordDone, onDrillDone } = $props()

  // svelte-ignore state_referenced_locally
  const session = new DrillStrokeSession({ items, wordProgress, onWordDone, onDrillDone })

  $effect(() => {
    const _charIdx = session.charIndex
    const _item = session.currentItem
    if (session.currentChar) session.initStrokeQuiz()
    return () => session.destroyStrokeQuiz()
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
      <span class="anuka-badge anuka-main">{session.currentStat.successCount}{#if session.currentStat.errorCount > 0}<span class="anuka-fail">| {session.currentStat.errorCount}</span>{/if}</span>
    {/if}

    <div class="anuka-stack anuka-center">
      <div class="anuka-row anuka-center anuka-compact">
        <span>{session.currentItem.tr}</span>
        {#if session.showPinyin}
          <span class="anuka-mute">·</span>
          <button class="anuka-btn-link" type="button" translate="no" onclick={() => session.speak(session.currentItem.word)}>{session.currentItem.pinyin}</button>
        {/if}
      </div>

      <div class="anuka-row anuka-compact anuka-hanzi anuka-lg" translate="no" lang="zh">
        {#each session.hanChars as char, idx}
          {@const done = idx < session.charIndex || (idx === session.charIndex && session.wordDelay) || session.strokeQuizResult === 'correct'}
          <span class="anuka-tile" class:anuka-main={idx === session.charIndex || done}>
            {#if done}{char}{:else}&nbsp;{/if}
          </span>
        {/each}
      </div>

      <div class="anuka-frame" data-no-touch>
        <div id="drill-canvas"></div>
        {#if session.wordDelay}
          <ProgressLine class="anuka-sm" fill={session.wordDelayProgress}>
            {#snippet top()}<div class="anuka-row anuka-center"><button class="anuka-btn-link anuka-sm" type="button" onclick={() => session.skipDelay()}>Next</button></div>{/snippet}
          </ProgressLine>
        {/if}
      </div>

      {#if !session.strokeQuizResult || session.wordDelay}
        <div class="anuka-row anuka-center">
          <BtnIcon onclick={() => session.speak(session.currentItem.word)} label="Play audio">
            <span class="anuka-icon anuka-icon-speaker"></span>
          </BtnIcon>
          <Btn main={session.showPinyin} onclick={() => (session.showPinyin = !session.showPinyin)}>Pinyin</Btn>
          <Btn main={session.showHint} onclick={() => session.toggleHint()}>Hint</Btn>
          {#if session.wordDelay}
            <Btn onclick={() => session.repeatWord()}>Repeat</Btn>
          {:else}
            <Btn onclick={() => session.skipWord()}>Skip</Btn>
          {/if}
        </div>
      {/if}
    </div>
  </Island>
{/if}

{#if session.sessionDone}
  <Island>
    <div class="anuka-stack anuka-center anuka-compact">
      <div class="anuka-main anuka-lg">Session complete</div>
      <div class="anuka-mute anuka-sm">{session.drilledCount} drilled &middot; {session.skippedCount} skipped</div>
      <Btn main onclick={() => session.restart()}>Restart</Btn>
      <Btn onclick={() => window.location.href = backUrl}>Groups</Btn>
    </div>
  </Island>
{/if}

<ProgressLine fill={session.progress}>
  {#snippet bottom()}<div class="anuka-row anuka-center"><span class="anuka-mute anuka-sm">{session.currentIndex + 1} / {session.items.length}</span></div>{/snippet}
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
        <span class="anuka-sm">{stat.successCount}{#if stat.errorCount > 0}<span class="anuka-fail">| {stat.errorCount}</span>{/if}</span>
      {/if}
    </span>
  {/each}
</div>

<Island>
  <span class="anuka-lg">Stroke Drill</span>
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
