<script>
  import { tick } from 'svelte'
  import HanziWriter from 'hanzi-writer'
  import Island from '@std/ui/island.svelte'
  import ProgressLine from '@std/ui/progress-line.svelte'
  import Btn from '@std/ui/btn.svelte'
  import BtnIcon from '@std/ui/btn-icon.svelte'

  let {
    group, datasetId, translationField, backUrl,
    groupStats = new Map(),
    isAuthenticated = false,
    onLoadGroupStats = async () => new Map(),
    onStartSession = async () => null,
    onEndSession = async () => {},
    onRecordAttempt = async () => {},
  } = $props()
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
  const currentStat = $derived.by(() => currentItem ? groupStats.get(currentItem.id) : null)
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
          if (isAuthenticated && item) {
            if (!sessionIdPromise) {
              sessionIdPromise = onStartSession(datasetId, practiceType, group.group)
            }
            sessionIdPromise.then((sid) => {
              if (sid != null) onRecordAttempt(sid, item.id, wStartedAt, charDoneAt, updatedCharData)
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
      if (isAuthenticated && sessionIdPromise) {
        sessionIdPromise.then((sid) => {
          if (sid != null) onEndSession(sid)
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
    sessionIdPromise = null
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
        sessionIdPromise = null
        onLoadGroupStats(datasetId, practiceType, group.group).then((stats) => {
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

<svelte:window onkeydown={(e) => { if (e.key === 'F1') { e.preventDefault(); hintManuallySet = true; showHint = !showHint; if (writer) showHint ? writer.showOutline() : writer.hideOutline() }}} />

<div class="anuka-stack">
  {#if currentItem && !sessionDone}
    <Island>
      <a class="anuka-quick" href={backUrl} title="Back">
        <span class="anuka-icon anuka-icon-close"></span>
      </a>
      {#if isAuthenticated && currentStat}
        <span class="anuka-badge anuka-main">{currentStat.successCount}{#if currentStat.errorCount > 0}<span class="anuka-fail">| {currentStat.errorCount}</span>{/if}</span>
      {/if}
      <div class="anuka-stack anuka-center">
        <div class="anuka-row anuka-center anuka-compact">
          <span>{currentItem[translationField]}</span>
          {#if showPinyin}
            <span class="anuka-mute">·</span>
            <button class="anuka-btn-link" type="button" translate="no" onclick={() => speak(currentItem.word)}>{currentItem.pinyin}</button>
          {/if}
        </div>

        <div class="anuka-row anuka-compact anuka-hanzi anuka-lg" translate="no" lang="zh">
          {#each hanChars as char, idx}
            {@const done = idx < charIndex || (idx === charIndex && wordDelay) || quizResult === 'correct'}
            <span class="anuka-tile" class:anuka-main={idx === charIndex || done}>
              {#if done}{char}{:else}&nbsp;{/if}
            </span>
          {/each}
        </div>

        <div class="anuka-frame" data-no-touch>
          <div id="practice-canvas"></div>
          {#if wordDelay}
            <ProgressLine class="anuka-sm" fill={wordDelayProgress}>
              {#snippet top()}<div class="anuka-row anuka-center"><button class="anuka-btn-link anuka-sm" type="button" onclick={skipDelay}>Next</button></div>{/snippet}
            </ProgressLine>
          {/if}
        </div>

        {#if !quizResult || wordDelay}
          <div class="anuka-row anuka-center">
            <BtnIcon onclick={() => speak(currentItem.word)} label="Play audio">
              <span class="anuka-icon anuka-icon-speaker"></span>
            </BtnIcon>
            <Btn main={showPinyin} onclick={() => showPinyin = !showPinyin}>Pinyin</Btn>
            <Btn main={showHint} onclick={() => { hintManuallySet = true; showHint = !showHint; if (writer) showHint ? writer.showOutline() : writer.hideOutline() }}>Hint</Btn>
            {#if wordDelay}
              <Btn onclick={repeatWord}>Repeat</Btn>
            {:else}
              <Btn onclick={skipWord}>Skip</Btn>
            {/if}
          </div>
        {/if}
      </div>
    </Island>
  {/if}

  {#if sessionDone}
    <Island>
      <div class="anuka-stack anuka-center anuka-compact">
        <div class="anuka-main anuka-lg">Session complete</div>
        <div class="anuka-mute anuka-sm">{practicedCount} practiced &middot; {skippedCount} skipped</div>
        <Btn main onclick={restartSession}>Restart</Btn>
        <Btn onclick={() => window.location.href = backUrl}>Groups</Btn>
      </div>
    </Island>
  {/if}

  <ProgressLine fill={progress}>
    {#snippet bottom()}<div class="anuka-row anuka-center"><span class="anuka-mute anuka-sm">{currentIndex + 1} / {items.length}</span></div>{/snippet}
  </ProgressLine>

  <div class="anuka-tags anuka-center">
    {#each items as item, idx}
      {@const stat = groupStats.get(item.id)}
      <span
        class="anuka-tag"
        class:anuka-main={idx === currentIndex}
        class:anuka-succ={completedWords.has(idx)}
        title="{item.word}"
      >
        {item[translationField]}
        {#if isAuthenticated && stat}
          <span class="anuka-sm">{stat.successCount}{#if stat.errorCount > 0}<span class="anuka-fail">| {stat.errorCount}</span>{/if}</span>
        {/if}
      </span>
    {/each}
  </div>
</div>

