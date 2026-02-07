<script>
  import { tick } from 'svelte'
  import { startGroupSession, endGroupSession, recordWordAttempt, loadGroupStats, groupStats } from '../../state/practice-stats.js'
  import { isAuthenticated } from '../../state/auth.js'
  import { diacriticToToneNumber, splitPinyin } from '../../utils/pinyin.js'

  let { group, datasetId, translationField, backUrl } = $props()
  const practiceType = 'pinyin'

  const rawItems = $derived.by(() => group?.items ?? [])
  let items = $state([])
  let currentIndex = $state(0)
  let charIndex = $state(0)
  let completedWords = $state(new Set())
  let sessionStartedAt = $state(null)
  let practicedCount = $state(0)
  let skippedCount = $state(0)
  let sessionDone = $state(false)
  let wordDelay = $state(null)
  let wordDelayProgress = $state(100)

  // Char-level tracking
  let sessionIdPromise = null
  let wordStartedAt = $state(null)
  let charStartedAt = $state(null)
  let charErrorCount = $state(0)
  let charData = $state([])

  // Pinyin-specific
  let inputValue = $state('')
  let showHint = $state(false)
  let hintManuallySet = $state(false)
  let shaking = $state(false)
  let showTranslation = $state(true)
  let charDoneMap = $state(new Map()) // charIndex → numbered pinyin (for display on completed tabs)

  const isHanChar = (ch) => /[\u4e00-\u9fff]/.test(ch)
  const currentItem = $derived.by(() => items[currentIndex] ?? null)
  const currentStat = $derived.by(() => currentItem ? $groupStats.get(currentItem.id) : null)
  const hanChars = $derived.by(() =>
    currentItem ? currentItem.word.split('').filter(isHanChar) : []
  )
  const pinyinSlots = $derived.by(() =>
    currentItem ? splitPinyin(currentItem.pinyin, currentItem.word) : []
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
    if (delayTimerId) { clearTimeout(delayTimerId); delayTimerId = null }
    if (delayAnimationId) { cancelAnimationFrame(delayAnimationId); delayAnimationId = null }
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

  let inputEl = $state(null)

  const focusInput = async () => {
    await tick()
    inputEl?.focus()
  }

  const advanceChar = () => {
    let next = charIndex + 1
    const now = new Date().toISOString()
    // Skip auto-complete slots (erhua 儿)
    while (next < pinyinSlots.length && pinyinSlots[next].autoComplete) {
      charDoneMap = new Map([...charDoneMap, [next, '']])
      charData = [...charData, {
        charIndex: next,
        startedAt: now,
        doneAt: now,
        errorCount: 0,
      }]
      next++
    }

    if (next < hanChars.length) {
      charIndex = next
      inputValue = ''
      charErrorCount = 0
      charStartedAt = now
      focusInput()
    } else {
      // Completed all characters in this word
      completeWord()
    }
  }

  const completeWord = () => {
    const charDoneAt = new Date().toISOString()
    const updatedCharData = [...charData]
    completedWords = new Set([...completedWords, currentIndex])
    practicedCount += 1
    const item = items[currentIndex]
    const wStartedAt = wordStartedAt
    charData = []
    if ($isAuthenticated && item) {
      if (!sessionIdPromise) {
        sessionIdPromise = startGroupSession(datasetId, practiceType, group.group)
      }
      sessionIdPromise.then((sid) => {
        if (sid != null) recordWordAttempt(sid, item.id, wStartedAt, charDoneAt, updatedCharData)
      }).catch((e) => console.error('recordWordAttempt failed', e))
    }
    if (currentIndex < items.length - 1) {
      startDelay(hanChars.length * 1000, () => {
        currentIndex += 1
        charIndex = 0
        charDoneMap = new Map()
        inputValue = ''
      })
    } else {
      maybeFinishSession()
    }
  }

  const handleInput = () => {
    const val = inputValue.trim().toLowerCase()
    if (!val) return
    const lastChar = val[val.length - 1]
    if (!/[1-5]/.test(lastChar)) return

    // Tone digit entered — validate
    const slot = pinyinSlots[charIndex]
    if (!slot || slot.autoComplete) return
    const expected = diacriticToToneNumber(slot.pinyin)
    if (val === expected) {
      // Correct
      const charDoneAt = new Date().toISOString()
      charDoneMap = new Map([...charDoneMap, [charIndex, slot.pinyin]])
      charData = [...charData, {
        charIndex: charIndex,
        startedAt: charStartedAt,
        doneAt: charDoneAt,
        errorCount: charErrorCount,
      }]
      advanceChar()
    } else {
      // Wrong
      charErrorCount += 1
      shaking = true
      setTimeout(() => { shaking = false }, 300)
      inputValue = ''
      focusInput()
    }
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

  const skipWord = () => {
    clearDelay()
    charData = []
    wordStartedAt = null
    completedWords = new Set([...completedWords, currentIndex])
    skippedCount += 1
    if (currentIndex < items.length - 1) {
      currentIndex += 1
      charIndex = 0
      charDoneMap = new Map()
      inputValue = ''
    } else {
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
    showHint = false
    charData = []
    charDoneMap = new Map()
    wordStartedAt = null
    charStartedAt = null
    charErrorCount = 0
    inputValue = ''
    sessionIdPromise = null
  }

  // Focus input when charIndex or currentIndex changes
  $effect(() => {
    const _ci = charIndex
    const _wi = currentIndex
    if (currentChar && !sessionDone && !wordDelay) {
      charStartedAt = new Date().toISOString()
      charErrorCount = 0
      if (charIndex === 0) {
        wordStartedAt = new Date().toISOString()
      }
      focusInput()
    }
  })

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
      showHint = false
      charData = []
      charDoneMap = new Map()
      wordStartedAt = null
      charStartedAt = null
      charErrorCount = 0
      inputValue = ''
      if (datasetId) {
        sessionIdPromise = null
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

<svelte:window onkeydown={(e) => { if (e.key === 'F1') { e.preventDefault(); hintManuallySet = true; showHint = !showHint }}} />

<div class="practice-container">
  {#if currentItem && !sessionDone}
    <div class="quiz-area">
      <a class="close-btn" href={backUrl} title="Back">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </a>
      {#if $isAuthenticated && currentStat}
        <span class="quiz-count" title="Times practiced">{currentStat.successCount}{#if currentStat.errorCount > 0}<span class="quiz-error-count">| {currentStat.errorCount}</span>{/if}</span>
      {/if}
      <div class="word-info" class:hidden-text={!showTranslation}>
        <span class="word-translation">{currentItem[translationField]}</span>
      </div>

      <div class="char-tabs" translate="no" lang="zh">
        {#each hanChars as char, idx}
          <div class="char-tab-wrapper">
            <span
              class="char-tab"
              class:active={idx === charIndex && !wordDelay}
              class:completed={charDoneMap.has(idx) || (completedWords.has(currentIndex) && wordDelay)}
            >
              {#if charDoneMap.has(idx) || (completedWords.has(currentIndex) && wordDelay)}
                {char}
              {:else}
                {char}
              {/if}
            </span>
            {#if charDoneMap.has(idx)}
              <span class="char-pinyin-label">{charDoneMap.get(idx)}</span>
            {:else if idx === charIndex && !wordDelay}
              <span class="char-pinyin-label {showHint ? '' : 'hint-hidden'}">
                {#if showHint}{pinyinSlots[charIndex]?.pinyin ?? ''}{:else}?{/if}
              </span>
            {:else}
              <span class="char-pinyin-label placeholder">&nbsp;</span>
            {/if}
          </div>
        {/each}
      </div>

      <div class="input-wrapper" class:shaking={shaking}>
        {#if wordDelay}
          <button type="button" class="delay-next-btn" onclick={skipDelay}>Next</button>
          <button type="button" class="delay-bar-btn" onclick={skipDelay} title="Skip to next word">
            <div class="delay-bar">
              <div class="delay-fill" style="width: {wordDelayProgress}%"></div>
            </div>
          </button>
        {:else}
          <input
            bind:this={inputEl}
            bind:value={inputValue}
            oninput={handleInput}
            type="text"
            class="pinyin-input"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            placeholder="pinyin (ex: lao3, shi1)"
          />
        {/if}
      </div>

      {#if !wordDelay}
        <div class="skip-area">
          <button type="button" class="btn-icon" onclick={() => speak(currentItem.word)} title="Play audio">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
          </button>
          <button type="button" class="btn-toggle" class:active={showTranslation} onclick={() => showTranslation = !showTranslation}>Tr</button>
          <button type="button" class="btn-toggle" class:active={showHint} onclick={() => { hintManuallySet = true; showHint = !showHint }}>Hint</button>
          <button type="button" class="btn-skip" onclick={skipWord}>Skip</button>
        </div>
      {:else}
        <div class="skip-area">
          <button type="button" class="btn-icon" onclick={() => speak(currentItem.word)} title="Play audio">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
          </button>
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
        title="{item.word}"
      >
        {item[translationField]}
        {#if $isAuthenticated && stat}
          <span class="dot-count">{stat.successCount}{#if stat.errorCount > 0}<span class="dot-error-count">| {stat.errorCount}</span>{/if}</span>
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

  .dot-error-count {
    color: var(--sun);
    margin-left: 0.25em;
  }

  .quiz-error-count {
    color: #b85450;
    margin-left: 0.25em;
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

  .word-info.hidden-text {
    visibility: hidden;
  }

  .word-speak {
    background: none;
    border: none;
    color: var(--accent);
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
  }

  .char-tabs {
    display: flex;
    gap: 0.35rem;
  }

  .char-tab-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }

  .char-tab {
    font-family: var(--font-chinese-hw);
    font-size: 3.5rem;
    line-height: 1;
    padding: 0.35rem;
    min-width: 4rem;
    min-height: 4rem;
    display: grid;
    place-items: center;
    border-radius: 10px;
    background: rgba(31, 111, 92, 0.06);
    color: var(--muted);
    transition: all 0.2s ease;
  }

  .char-tab.active {
    background: rgba(31, 111, 92, 0.06);
    color: var(--ink);
    box-shadow: 0 0 0 2px var(--accent);
  }

  .char-tab.completed {
    background: var(--accent);
    color: #fff;
  }

  .char-pinyin-label {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--accent);
    min-height: 1.4rem;
  }

  .char-pinyin-label.hint-hidden {
    color: var(--accent);
  }

  .char-pinyin-label.placeholder {
    visibility: hidden;
  }

  .input-wrapper {
    position: relative;
    width: 280px;
    min-height: 80px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .input-wrapper.shaking {
    animation: shake 0.3s ease;
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-8px); }
    40% { transform: translateX(8px); }
    60% { transform: translateX(-6px); }
    80% { transform: translateX(6px); }
  }

  .pinyin-input {
    width: 100%;
    text-align: center;
    font-size: 1.8rem;
    font-weight: 600;
    padding: 0.6rem 1rem;
    border: 2px solid rgba(31, 111, 92, 0.15);
    border-radius: 14px;
    background: #fff;
    color: var(--ink);
    outline: none;
    transition: border-color 0.2s ease;
    font-family: inherit;
  }

  .pinyin-input:focus {
    border-color: var(--accent);
  }

  .pinyin-input::placeholder {
    color: var(--muted);
    font-size: 1rem;
    font-weight: 400;
  }

  .delay-next-btn {
    background: none;
    border: none;
    color: var(--muted);
    font-size: 0.85rem;
    cursor: pointer;
    padding: 0.3rem 0.8rem;
    opacity: 0.7;
    transition: opacity 0.15s ease;
  }

  .delay-next-btn:hover {
    opacity: 1;
  }

  .delay-bar-btn {
    width: 100%;
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

    .input-wrapper {
      width: calc(100vw - 4rem);
      max-width: 320px;
    }
  }
</style>
