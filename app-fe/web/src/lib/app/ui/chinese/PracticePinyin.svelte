<script>
  import { tick } from 'svelte'
  import { startGroupSession, endGroupSession, recordWordAttempt, loadGroupStats, groupStats } from '@app/state/practice-stats.js'
  import { isAuthenticated } from '@app/state/auth.js'
  import { diacriticToToneNumber, splitPinyin } from '@std/pinyin.js'
  import Island from '@std/ui/Island.svelte'
  import ProgressLine from '@std/ui/ProgressLine.svelte'
  import Btn from '@std/ui/Btn.svelte'
  import BtnIcon from '@std/ui/BtnIcon.svelte'

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
  let feedback = $state(null) // null | 'fail'
  let showHint = $state(false)
  let hintManuallySet = $state(false)
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
      feedback = 'fail'
      setTimeout(() => { feedback = null }, 400)
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

<div class="anuka-stack">
  {#if currentItem && !sessionDone}
    <Island>
      <a class="anuka-quick" href={backUrl} title="Back">
        <span class="anuka-icon anuka-icon-close"></span>
      </a>
      {#if $isAuthenticated && currentStat}
        <span class="anuka-badge anuka-main">{currentStat.successCount}{#if currentStat.errorCount > 0}<span class="anuka-fail">| {currentStat.errorCount}</span>{/if}</span>
      {/if}
      <div class="anuka-stack anuka-center">
        <div class="anuka-row anuka-center anuka-compact" class:anuka-hidden={!showTranslation}>
          <span>{currentItem[translationField]}</span>
        </div>

        <div class="anuka-row anuka-compact anuka-hanzi anuka-lg" translate="no" lang="zh">
          {#each hanChars as char, idx}
            {@const done = charDoneMap.has(idx) || (completedWords.has(currentIndex) && wordDelay)}
            {@const active = idx === charIndex && !wordDelay}
            <div class="anuka-stack anuka-center anuka-compact">
              <span class="anuka-tile anuka-lg" class:anuka-main={done} class:anuka-mute={!done && !active}>
                {char}
              </span>
              {#if charDoneMap.has(idx)}
                <span class="anuka-main anuka-lg">{charDoneMap.get(idx)}</span>
              {:else if active}
                <span class="anuka-main anuka-lg">
                  {#if showHint}{pinyinSlots[charIndex]?.pinyin ?? ''}{:else}?{/if}
                </span>
              {:else}
                <span class="anuka-lg anuka-hidden">&nbsp;</span>
              {/if}
            </div>
          {/each}
        </div>

        {#if wordDelay}
          <ProgressLine class="anuka-sm" fill={wordDelayProgress}>
            {#snippet top()}<div class="anuka-row anuka-center"><button class="anuka-btn-link anuka-sm" type="button" onclick={skipDelay}>Next</button></div>{/snippet}
          </ProgressLine>
        {:else}
          <input
            bind:this={inputEl}
            bind:value={inputValue}
            oninput={handleInput}
            type="text"
            class="anuka-input" class:anuka-fail={feedback === 'fail'}
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            placeholder="pinyin (ex: lao3, shi1)"
          />
        {/if}

        {#if !wordDelay}
          <div class="anuka-row anuka-center">
            <BtnIcon onclick={() => speak(currentItem.word)} label="Play audio">
              <span class="anuka-icon anuka-icon-speaker"></span>
            </BtnIcon>
            <Btn main={showTranslation} onclick={() => showTranslation = !showTranslation}>Tr</Btn>
            <Btn main={showHint} onclick={() => { hintManuallySet = true; showHint = !showHint }}>Hint</Btn>
            <Btn onclick={skipWord}>Skip</Btn>
          </div>
        {:else}
          <div class="anuka-row anuka-center">
            <BtnIcon onclick={() => speak(currentItem.word)} label="Play audio">
              <span class="anuka-icon anuka-icon-speaker"></span>
            </BtnIcon>
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
      {@const stat = $groupStats.get(item.id)}
      <span
        class="anuka-tag"
        class:anuka-main={idx === currentIndex}
        class:anuka-succ={completedWords.has(idx)}
        title="{item.word}"
      >
        {item[translationField]}
        {#if $isAuthenticated && stat}
          <span class="anuka-sm">{stat.successCount}{#if stat.errorCount > 0}<span class="anuka-fail">| {stat.errorCount}</span>{/if}</span>
        {/if}
      </span>
    {/each}
  </div>
</div>

