<script>
  import { tick } from 'svelte'
  import HanziWriter from 'hanzi-writer'

  let { group } = $props()

  const items = $derived.by(() => group?.items ?? [])
  let currentIndex = $state(0)
  let charIndex = $state(0)
  let quizResult = $state(null) // null | 'correct' | 'incorrect'
  let completedWords = $state(new Set())

  const currentItem = $derived.by(() => items[currentIndex] ?? null)
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
      showOutline: false,
      strokeAnimationSpeed: 1,
      delayBetweenStrokes: 100,
      highlightOnComplete: true,
      drawingWidth: 20,
      leniency: 1.4,
      showHintAfterMisses: false,
    })

    writer.quiz({
      onComplete: () => {
        if (charIndex < hanChars.length - 1) {
          // Move to next character in the word
          setTimeout(() => {
            charIndex += 1
          }, 600)
        } else {
          // Completed all characters in this word
          quizResult = 'correct'
          completedWords = new Set([...completedWords, currentIndex])
        }
      },
    })
  }

  $effect(() => {
    if (currentChar) {
      initQuiz()
    }
    return () => destroyWriter()
  })

  const goToWord = (index) => {
    currentIndex = index
    charIndex = 0
    quizResult = null
  }

  const nextWord = () => {
    if (currentIndex < items.length - 1) {
      goToWord(currentIndex + 1)
    }
  }

  const prevWord = () => {
    if (currentIndex > 0) {
      goToWord(currentIndex - 1)
    }
  }

  const retryWord = () => {
    charIndex = 0
  }

  // Reset when group changes
  $effect(() => {
    if (group) {
      currentIndex = 0
      charIndex = 0
      completedWords = new Set()
    }
  })
</script>

<div class="practice-container">
  {#if currentItem}
    <div class="quiz-area">
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

      {#if quizResult === 'correct'}
        <div class="result-banner">
          <p class="result-word" translate="no" lang="zh">{currentItem.word}</p>
          <p class="result-detail">{currentItem.pinyin} &middot; {currentItem.english}</p>
          <div class="result-actions">
            <button type="button" class="btn-secondary" onclick={retryWord}>Retry</button>
            {#if currentIndex < items.length - 1}
              <button type="button" class="btn-primary" onclick={nextWord}>Next word</button>
            {:else}
              <p class="result-msg">All words done!</p>
            {/if}
          </div>
        </div>
      {/if}

      <div class="nav-buttons">
        <button type="button" class="btn-secondary" onclick={prevWord} disabled={currentIndex === 0}>
          Previous
        </button>
        <span class="nav-pos">{currentIndex + 1} / {items.length}</span>
        <button type="button" class="btn-secondary" onclick={nextWord} disabled={currentIndex === items.length - 1}>
          Next
        </button>
      </div>
    </div>
  {/if}

  <div class="progress-bar">
    <div class="progress-fill" style="width: {progress}%"></div>
  </div>
  <div class="progress-text">{completedWords.size} / {items.length} completed</div>

  <div class="word-nav" translate="no" lang="zh">
    {#each items as item, idx}
      <button
        class="word-dot"
        class:active={idx === currentIndex}
        class:done={completedWords.has(idx)}
        type="button"
        onclick={() => goToWord(idx)}
        title={item.word}
      >
        {item.word}
      </button>
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
    cursor: pointer;
    font-size: 0.9rem;
    font-family: var(--font-chinese);
    color: var(--ink);
    transition: all 0.2s ease;
  }

  .word-dot:hover {
    background: rgba(31, 111, 92, 0.08);
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

  .quiz-area {
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

  .word-english {
    font-size: 1rem;
    color: var(--muted);
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

  .result-banner {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
    padding: 1rem 0 0;
  }

  .result-word {
    font-family: var(--font-chinese);
    font-size: 2rem;
    font-weight: 700;
    margin: 0;
  }

  .result-detail {
    margin: 0;
    color: var(--muted);
  }

  .result-msg {
    margin: 0;
    font-weight: 600;
    color: var(--accent);
  }

  .result-actions {
    display: flex;
    gap: 0.8rem;
    margin-top: 0.6rem;
  }

  .nav-buttons {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1.5rem;
  }

  .nav-pos {
    font-size: 0.9rem;
    color: var(--muted);
  }

  .btn-primary {
    border: none;
    background: var(--accent);
    color: #fff;
    border-radius: 999px;
    padding: 0.6rem 1.4rem;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.95rem;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(31, 111, 92, 0.25);
  }

  .btn-secondary {
    border: 1px solid rgba(31, 111, 92, 0.3);
    background: #fffdf7;
    color: var(--ink);
    border-radius: 999px;
    padding: 0.6rem 1.4rem;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.95rem;
    transition: background 0.2s ease;
  }

  .btn-secondary:hover:not(:disabled) {
    background: rgba(31, 111, 92, 0.08);
  }

  .btn-secondary:disabled {
    opacity: 0.4;
    cursor: not-allowed;
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
