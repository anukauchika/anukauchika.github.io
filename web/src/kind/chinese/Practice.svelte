<script>
  import { tick } from 'svelte'
  import HanziWriter from 'hanzi-writer'
  import { recordSuccess, recordGroupSession, loadGroupStats, groupStats } from '../../state/practice-stats.js'

  let { group, datasetId, translationField } = $props()
  const practiceType = 'stroke'

  const rawItems = $derived.by(() => group?.items ?? [])
  let items = $state([])
  let currentIndex = $state(0)
  let charIndex = $state(0)
  let quizResult = $state(null) // null | 'correct' | 'skipped'
  let completedWords = $state(new Set())
  let sessionStartedAt = $state(null)
  let practicedCount = $state(0)
  let skippedCount = $state(0)
  let sessionDone = $state(false)
  let showHint = $state(false)

  const currentItem = $derived.by(() => items[currentIndex] ?? null)
  const currentStat = $derived.by(() => currentItem ? $groupStats.get(currentItem.id) : null)
  const isHanChar = (char) => /[\u4e00-\u9fff]/.test(char)
  const hanChars = $derived.by(() =>
    currentItem ? currentItem.word.split('').filter(isHanChar) : []
  )
  const currentChar = $derived.by(() => hanChars[charIndex] ?? null)
  const progress = $derived.by(() =>
    items.length > 0 ? Math.round((completedWords.size / items.length) * 100) : 0
  )

  const speak = (text) => {
    if (!('speechSynthesis' in window)) return
    speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'zh-CN'
    utterance.rate = 0.8
    speechSynthesis.speak(utterance)
  }

  let writer = null

  const destroyWriter = () => {
    if (writer) {
      writer.cancelQuiz()
      writer = null
    }
    const target = document.getElementById('practice-canvas')
    if (target) target.innerHTML = ''
  }

  const initQuiz = async () => {
    destroyWriter()
    quizResult = null
    await tick()

    if (!currentChar) return

    const target = document.getElementById('practice-canvas')
    if (!target) return

    if (charIndex === 0) speak(currentItem.word)

    writer = HanziWriter.create(target, currentChar, {
      width: 280,
      height: 280,
      padding: 20,
      showCharacter: false,
      showOutline: showHint,
      strokeAnimationSpeed: 1,
      delayBetweenStrokes: 100,
      highlightOnComplete: true,
      drawingWidth: 20,
      leniency: 1.4,
      showHintAfterMisses: 2,
    })

    writer.quiz({
      onComplete: () => {
        if (charIndex < hanChars.length - 1) {
          // Move to next character in the word
          setTimeout(() => {
            charIndex += 1
          }, 1500)
        } else {
          // Completed all characters in this word
          completedWords = new Set([...completedWords, currentIndex])
          practicedCount += 1
          const item = items[currentIndex]
          if (item) recordSuccess(datasetId, practiceType, group.group, item.id)
          if (currentIndex < items.length - 1) {
            setTimeout(() => {
              currentIndex += 1
              charIndex = 0
              quizResult = null
            }, 600)
          } else {
            quizResult = 'correct'
            maybeFinishSession()
          }
        }
      },
    })
  }

  const maybeFinishSession = () => {
    if (completedWords.size >= items.length) {
      sessionDone = true
      recordGroupSession({
        datasetId,
        practiceType,
        groupId: group.group,
        practicedCount,
        skippedCount,
        startedAt: sessionStartedAt,
        completedAt: new Date().toISOString(),
      })
    }
  }

  // Auto-enable hint for unpracticed words, reset on each char
  $effect(() => {
    if (currentItem) {
      const _ = charIndex // track charIndex to reset on char change
      const successCount = currentStat?.successCount ?? 0
      showHint = successCount === 0
    }
  })

  $effect(() => {
    if (currentChar) {
      initQuiz()
    }
    return () => destroyWriter()
  })

  const skipWord = () => {
    completedWords = new Set([...completedWords, currentIndex])
    skippedCount += 1
    if (currentIndex < items.length - 1) {
      currentIndex += 1
      charIndex = 0
      quizResult = null
    } else {
      quizResult = 'skipped'
      maybeFinishSession()
    }
  }

  // Reset when group changes — sort once at session start
  $effect(() => {
    if (group) {
      currentIndex = 0
      charIndex = 0
      completedWords = new Set()
      sessionStartedAt = new Date().toISOString()
      practicedCount = 0
      skippedCount = 0
      sessionDone = false
      if (datasetId) {
        loadGroupStats(datasetId, practiceType, group.group).then(() => {
          const stats = $groupStats
          items = [...rawItems].sort((a, b) => {
            const ca = stats.get(a.id)?.successCount ?? 0
            const cb = stats.get(b.id)?.successCount ?? 0
            return ca - cb
          })
        })
      } else {
        items = [...rawItems]
      }
    }
  })
</script>

<div class="practice-container">
  {#if currentItem && !sessionDone}
    <div class="quiz-area">
      {#if currentStat}
        <span class="quiz-count" title="Times practiced">{currentStat.successCount}x</span>
      {/if}
      <div class="word-info" translate="no">
        <button class="word-pinyin" type="button" onclick={() => speak(currentItem.word)}>{currentItem.pinyin}</button>
      </div>

      <div class="char-tabs" translate="no" lang="zh">
        {#each hanChars as char, idx}
          <span
            class="char-tab"
            class:active={idx === charIndex}
            class:completed={idx < charIndex || quizResult === 'correct'}
          >
            {#if idx < charIndex || quizResult === 'correct'}
              {char}
            {:else}
              &nbsp;
            {/if}
          </span>
        {/each}
      </div>

      <div class="canvas-wrapper">
        <div id="practice-canvas"></div>
      </div>

      {#if !quizResult}
        <div class="skip-area">
          <button type="button" class="btn-hint" class:active={showHint} onclick={() => { showHint = !showHint; initQuiz() }}>Hint</button>
          <button type="button" class="btn-skip" onclick={skipWord}>Skip</button>
        </div>
      {/if}

      <span class="nav-pos">{currentIndex + 1} / {items.length}</span>
    </div>
  {/if}

  {#if sessionDone}
    <div class="session-banner">
      <p class="session-title">Session complete</p>
      <p class="session-detail">{practicedCount} practiced &middot; {skippedCount} skipped</p>
    </div>
  {/if}

  <div class="progress-bar">
    <div class="progress-fill" style="width: {progress}%"></div>
  </div>
  <div class="progress-text">{completedWords.size} / {items.length} completed</div>

  <div class="word-nav">
    {#each items as item, idx}
      {@const stat = $groupStats.get(item.id)}
      <span
        class="word-dot"
        class:active={idx === currentIndex}
        class:done={completedWords.has(idx)}
        title="{item.word}{stat ? ` (${stat.successCount}x)` : ''}"
      >
        {item[translationField]}
        {#if stat}
          <span class="dot-count">{stat.successCount}</span>
        {/if}
      </span>
    {/each}
  </div>
</div>

<style>
  .practice-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .progress-bar {
    height: 8px;
    background: rgba(31, 111, 92, 0.12);
    border-radius: 999px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: var(--accent);
    border-radius: 999px;
    transition: width 0.4s ease;
  }

  .progress-text {
    text-align: center;
    font-size: 0.85rem;
    color: var(--muted);
  }

  .word-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
  }

  .word-dot {
    border: 1px solid rgba(31, 111, 92, 0.2);
    background: var(--card);
    padding: 0.3rem 0.6rem;
    border-radius: 10px;
    font-size: 0.9rem;
    font-family: var(--font-chinese);
    color: var(--ink);
    transition: all 0.2s ease;
  }

  .word-dot.active {
    background: var(--accent);
    color: #fff;
    border-color: var(--accent);
  }

  .word-dot.done {
    background: var(--accent-soft);
    border-color: var(--accent-soft);
    color: #fff;
  }

  .word-dot.done.active {
    background: var(--accent);
    border-color: var(--accent);
  }

  .dot-count {
    font-size: 0.65rem;
    font-weight: 700;
    opacity: 0.7;
    margin-left: 0.15rem;
  }

  .quiz-area {
    position: relative;
    background: var(--card);
    border-radius: 24px;
    padding: 2rem;
    box-shadow: var(--shadow);
    border: 1px solid rgba(31, 111, 92, 0.08);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.2rem;
  }

  .quiz-count {
    position: absolute;
    top: 1rem;
    right: 1.2rem;
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--accent);
    background: rgba(31, 111, 92, 0.08);
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
  }

  .word-info {
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .word-pinyin {
    font-size: 1.3rem;
    font-weight: 600;
    color: var(--accent);
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    font-family: inherit;
  }


  .char-tabs {
    display: flex;
    gap: 0.6rem;
  }

  .char-tab {
    font-family: var(--font-chinese);
    font-size: 1.6rem;
    padding: 0.3rem 0.7rem;
    border-radius: 10px;
    background: rgba(31, 111, 92, 0.06);
    color: var(--muted);
    transition: all 0.2s ease;
  }

  .char-tab.active {
    background: var(--accent);
    color: #fff;
    font-weight: 600;
  }

  .char-tab.completed {
    background: var(--accent-soft);
    color: #fff;
  }

  .canvas-wrapper {
    width: 280px;
    height: 280px;
    background: #fff;
    border-radius: 18px;
    border: 2px solid rgba(31, 111, 92, 0.15);
    display: grid;
    place-items: center;
    touch-action: none;
  }

  .skip-area {
    display: flex;
    justify-content: center;
    gap: 0.75rem;
  }

  .btn-hint {
    border: 1px solid rgba(31, 111, 92, 0.3);
    background: none;
    color: var(--muted);
    border-radius: 999px;
    padding: 0.4rem 1.2rem;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 600;
    transition: background 0.2s ease, border-color 0.2s ease;
  }

  .btn-hint:hover {
    background: rgba(31, 111, 92, 0.06);
  }

  .btn-hint.active {
    background: var(--accent);
    color: #fff;
    border-color: var(--accent);
  }

  .btn-skip {
    border: 1px dashed rgba(31, 111, 92, 0.3);
    background: none;
    color: var(--muted);
    border-radius: 999px;
    padding: 0.4rem 1.2rem;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 600;
    transition: background 0.2s ease;
  }

  .btn-skip:hover {
    background: rgba(31, 111, 92, 0.06);
  }

  .nav-pos {
    display: block;
    text-align: center;
    font-size: 0.9rem;
    color: var(--muted);
  }

  .session-banner {
    text-align: center;
    background: rgba(31, 111, 92, 0.08);
    border: 1px solid rgba(31, 111, 92, 0.2);
    border-radius: 16px;
    padding: 1.2rem;
  }

  .session-title {
    margin: 0;
    font-weight: 700;
    font-size: 1.1rem;
    color: var(--accent);
  }

  .session-detail {
    margin: 0.3rem 0 0;
    font-size: 0.85rem;
    color: var(--muted);
  }

  @media (max-width: 600px) {
    .quiz-area {
      padding: 0.75rem;
    }

    .canvas-wrapper {
      width: calc(100vw - 4rem);
      height: calc(100vw - 4rem);
      max-width: 320px;
      max-height: 320px;
    }
  }
</style>
