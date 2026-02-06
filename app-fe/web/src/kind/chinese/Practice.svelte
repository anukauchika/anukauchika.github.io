<script>
  import { tick } from 'svelte'
  import HanziWriter from 'hanzi-writer'
  import { startGroupSession, endGroupSession, recordWordAttempt, loadGroupStats, groupStats } from '../../state/practice-stats.js'
  import { isAuthenticated } from '../../state/auth.js'

  let { group, datasetId, translationField, backUrl } = $props()
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
  let hintManuallySet = $state(false)
  let showPinyin = $state(true)
  let wordDelay = $state(null) // { startTime, duration }
  let wordDelayProgress = $state(100)

  // Char-level tracking
  let sessionIdPromise = null
  let wordStartedAt = $state(null)
  let charStartedAt = $state(null)
  let charErrorCount = $state(0)
  let charData = $state([])

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

  let delayTimerId = null
  let delayAnimationId = null
  let delayCallback = null

  const startDelay = (duration, onComplete) => {
    clearDelay()
    delayCallback = onComplete
    const startTime = Date.now()
    wordDelay = { startTime, duration }
    wordDelayProgress = 100

    const animate = () => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      wordDelayProgress = remaining
      if (remaining > 0) {
        delayAnimationId = requestAnimationFrame(animate)
      }
    }
    delayAnimationId = requestAnimationFrame(animate)

    delayTimerId = setTimeout(() => {
      const callback = delayCallback
      clearDelay()
      callback()
    }, duration)
  }

  const clearDelay = () => {
    if (delayTimerId) {
      clearTimeout(delayTimerId)
      delayTimerId = null
    }
    if (delayAnimationId) {
      cancelAnimationFrame(delayAnimationId)
      delayAnimationId = null
    }
    delayCallback = null
    wordDelay = null
    wordDelayProgress = 100
  }

  const skipDelay = () => {
    if (delayTimerId && delayCallback) {
      const callback = delayCallback
      clearDelay()
      callback()
    }
  }

  const repeatWord = () => {
    clearDelay()
    charData = []
    wordStartedAt = null
    const wasZero = charIndex === 0
    charIndex = 0
    quizResult = null
    // Only call initQuiz directly for single-char words (charIndex already 0)
    // Otherwise the $effect will handle it when charIndex changes
    if (wasZero) {
      initQuiz()
    }
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

  const initQuiz = async (skipSpeak = false) => {
    destroyWriter()
    quizResult = null
    await tick()

    if (!currentChar) return

    const target = document.getElementById('practice-canvas')
    if (!target) return

    if (charIndex === 0 && !skipSpeak) speak(currentItem.word)

    // Track char start; first char of word sets wordStartedAt
    charStartedAt = new Date().toISOString()
    charErrorCount = 0
    if (charIndex === 0) wordStartedAt = new Date().toISOString()

    writer = HanziWriter.create(target, currentChar, {
      width: 280,
      height: 280,
      padding: 20,
      showCharacter: false,
      showOutline: showHint,
      strokeAnimationSpeed: 1,
      delayBetweenStrokes: 100,
      highlightOnComplete: false,
      drawingWidth: 20,
      leniency: 1.4,
      showHintAfterMisses: 2,
      radicalColor: '#1f6f5c',
    })

    writer.quiz({
      onMistake: () => {
        charErrorCount += 1
      },
      onComplete: () => {
        const charDoneAt = new Date().toISOString()
        const updatedCharData = [...charData, {
          charIndex: charIndex,
          startedAt: charStartedAt,
          doneAt: charDoneAt,
          errorCount: charErrorCount,
        }]

        if (charIndex < hanChars.length - 1) {
          charData = updatedCharData
          // Move to next character in the word
          startDelay(1500, () => {
            charIndex += 1
          })
        } else {
          // Completed all characters in this word
          completedWords = new Set([...completedWords, currentIndex])
          practicedCount += 1
          quizResult = 'correct'
          const item = items[currentIndex]
          const wStartedAt = wordStartedAt
          charData = []
          if ($isAuthenticated && item && sessionIdPromise) {
            sessionIdPromise.then((sid) => {
              if (sid != null) recordWordAttempt(sid, item.id, wStartedAt, charDoneAt, updatedCharData)
            }).catch((e) => console.error('recordWordAttempt failed', e))
          }
          if (currentIndex < items.length - 1) {
            startDelay(5000, () => {
              currentIndex += 1
              charIndex = 0
              quizResult = null
            })
          } else {
            maybeFinishSession()
          }
        }
      },
    })
  }

  const maybeFinishSession = () => {
    if (completedWords.size >= items.length) {
      sessionDone = true
      if ($isAuthenticated && sessionIdPromise) {
        sessionIdPromise.then((sid) => {
          if (sid != null) endGroupSession(sid)
        }).catch((e) => console.error('endGroupSession failed', e))
      }
    }
  }

  // Auto-enable hint for unpracticed words (unless user toggled manually)
  $effect(() => {
    if (currentItem && !hintManuallySet) {
      showHint = (currentStat?.successCount ?? 0) === 0
    }
  })

  $effect(() => {
    // Track charIndex and currentIndex to re-init even when same character repeats
    const _charIdx = charIndex
    const _wordIdx = currentIndex
    if (currentChar) {
      initQuiz()
    }
    return () => destroyWriter()
  })

  const skipWord = () => {
    clearDelay()
    charData = []
    wordStartedAt = null
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

  const restartSession = () => {
    clearDelay()
    currentIndex = 0
    charIndex = 0
    completedWords = new Set()
    sessionStartedAt = new Date().toISOString()
    practicedCount = 0
    skippedCount = 0
    sessionDone = false
    hintManuallySet = false
    charData = []
    wordStartedAt = null
    charStartedAt = null
    charErrorCount = 0
    sessionIdPromise = $isAuthenticated
      ? startGroupSession(datasetId, practiceType, group.group)
      : null
  }

  // Reset when group changes — sort once at session start
  $effect(() => {
    if (group) {
      clearDelay()
      currentIndex = 0
      charIndex = 0
      completedWords = new Set()
      sessionStartedAt = new Date().toISOString()
      practicedCount = 0
      skippedCount = 0
      sessionDone = false
      hintManuallySet = false
      charData = []
      wordStartedAt = null
      charStartedAt = null
      charErrorCount = 0
      if (datasetId) {
        // Start session and load stats in parallel
        sessionIdPromise = $isAuthenticated
          ? startGroupSession(datasetId, practiceType, group.group)
          : null
        loadGroupStats(datasetId, practiceType, group.group).then(() => {
          const stats = $groupStats
          items = [...rawItems].sort((a, b) => {
            const ca = stats.get(a.id)?.successCount ?? 0
            const cb = stats.get(b.id)?.successCount ?? 0
            return ca - cb
          })
        })
      } else {
        sessionIdPromise = null
        items = [...rawItems]
      }
    }
  })
</script>

<div class="practice-container">
  {#if currentItem && !sessionDone}
    <div class="quiz-area">
      <a class="close-btn" href={backUrl} title="Back">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </a>
      {#if $isAuthenticated && currentStat}
        <span class="quiz-count" title="Times practiced">{currentStat.successCount}x</span>
      {/if}
      <div class="word-info">
        <span class="word-translation">{currentItem[translationField]}</span>
        {#if showPinyin}
          <span class="word-separator">·</span>
          <button class="word-pinyin" type="button" translate="no" onclick={() => speak(currentItem.word)}>{currentItem.pinyin}</button>
        {/if}
      </div>

      <div class="char-tabs" translate="no" lang="zh">
        {#each hanChars as char, idx}
          <span
            class="char-tab"
            class:active={idx === charIndex}
            class:completed={idx < charIndex || (idx === charIndex && wordDelay) || quizResult === 'correct'}
          >
            {#if idx < charIndex || (idx === charIndex && wordDelay) || quizResult === 'correct'}
              {char}
            {:else}
              &nbsp;
            {/if}
          </span>
        {/each}
      </div>

      <div class="canvas-wrapper">
        <div id="practice-canvas"></div>
        {#if wordDelay}
          <button type="button" class="delay-next-btn" onclick={skipDelay}>Next</button>
          <button type="button" class="delay-bar-btn" onclick={skipDelay} title="Skip to next word">
            <div class="delay-bar">
              <div class="delay-fill" style="width: {wordDelayProgress}%"></div>
            </div>
          </button>
        {/if}
      </div>

      {#if !quizResult || wordDelay}
        <div class="skip-area">
          <button type="button" class="btn-icon" onclick={() => speak(currentItem.word)} title="Play audio">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
          </button>
          <button type="button" class="btn-toggle" class:active={showPinyin} onclick={() => showPinyin = !showPinyin}>Pinyin</button>
          <button type="button" class="btn-toggle" class:active={showHint} onclick={() => { hintManuallySet = true; showHint = !showHint; if (writer) showHint ? writer.showOutline() : writer.hideOutline() }}>Hint</button>
          {#if wordDelay}
            <button type="button" class="btn-skip" onclick={repeatWord}>Repeat</button>
          {:else}
            <button type="button" class="btn-skip" onclick={skipWord}>Skip</button>
          {/if}
        </div>
      {/if}

    </div>
  {/if}

  {#if sessionDone}
    <div class="session-banner">
      <p class="session-title">Session complete</p>
      <p class="session-detail">{practicedCount} practiced &middot; {skippedCount} skipped</p>
      <button type="button" class="btn-restart" onclick={restartSession}>Restart</button>
      <button type="button" class="btn-groups" onclick={() => window.location.href = backUrl}>Groups</button>
    </div>
  {/if}

  <div class="progress-bar">
    <div class="progress-fill" style="width: {progress}%"></div>
  </div>
  <div class="progress-text">{currentIndex + 1} / {items.length}</div>

  <div class="word-nav">
    {#each items as item, idx}
      {@const stat = $groupStats.get(item.id)}
      <span
        class="word-dot"
        class:active={idx === currentIndex}
        class:done={completedWords.has(idx)}
        title="{item.word}{$isAuthenticated && stat ? ` (${stat.successCount}x)` : ''}"
      >
        {item[translationField]}
        {#if $isAuthenticated && stat}
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
    margin-top: -1.25rem;
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

  .close-btn {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    color: var(--muted);
    transition: background 0.15s ease, color 0.15s ease;
  }

  .close-btn:hover {
    background: rgba(31, 111, 92, 0.1);
    color: var(--ink);
  }

  .quiz-count {
    position: absolute;
    top: 1rem;
    left: 1.2rem;
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--accent);
    background: rgba(31, 111, 92, 0.08);
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
  }

  .word-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .word-translation {
    font-size: 1.1rem;
    color: var(--ink);
  }

  .word-separator {
    color: var(--muted);
  }

  .word-pinyin {
    font-size: 1.1rem;
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
    font-family: var(--font-chinese-hw);
    font-size: 3rem;
    line-height: 1;
    padding: 0.25rem;
    min-width: 3.5rem;
    min-height: 3.5rem;
    display: grid;
    place-items: center;
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
    background: var(--accent);
    color: #fff;
  }

  .canvas-wrapper {
    position: relative;
    width: 280px;
    height: 280px;
    background: #fff;
    border-radius: 18px;
    border: 2px solid rgba(31, 111, 92, 0.15);
    display: grid;
    place-items: center;
    touch-action: none;
  }

  .delay-next-btn {
    position: absolute;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: none;
    border: none;
    color: var(--muted);
    font-size: 0.75rem;
    cursor: pointer;
    padding: 0.2rem 0.5rem;
    opacity: 0.7;
    transition: opacity 0.15s ease;
  }

  .delay-next-btn:hover {
    opacity: 1;
  }

  .delay-bar-btn {
    position: absolute;
    bottom: 10px;
    left: 20px;
    right: 20px;
    padding: 4px 0;
    background: none;
    border: none;
    cursor: pointer;
  }

  .delay-bar {
    height: 2px;
    background: rgba(31, 111, 92, 0.06);
    border-radius: 1px;
    overflow: hidden;
  }

  .delay-fill {
    height: 100%;
    background: rgba(31, 111, 92, 0.25);
    border-radius: 1px;
    transition: width 16ms linear;
  }

  .skip-area {
    display: flex;
    justify-content: center;
    gap: 0.75rem;
  }

  .btn-icon {
    border: 1px solid rgba(31, 111, 92, 0.3);
    background: none;
    color: var(--muted);
    border-radius: 999px;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s ease, color 0.2s ease;
  }

  .btn-icon:hover {
    background: rgba(31, 111, 92, 0.06);
    color: var(--accent);
  }

  .btn-toggle {
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

  .btn-toggle:hover {
    background: rgba(31, 111, 92, 0.06);
  }

  .btn-toggle.active {
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

  .btn-restart {
    margin-top: 1rem;
    border: 1px solid var(--accent);
    background: var(--accent);
    color: #fff;
    border-radius: 999px;
    padding: 0.5rem 1.5rem;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 600;
    transition: opacity 0.2s ease;
  }

  .btn-restart:hover {
    opacity: 0.9;
  }

  .btn-groups {
    margin-top: 0.75rem;
    border: 1px solid #b8b8b8;
    background: #b8b8b8;
    color: #fff;
    border-radius: 999px;
    padding: 0.5rem 1.5rem;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 600;
    transition: opacity 0.2s ease;
  }

  .btn-groups:hover {
    opacity: 0.9;
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
