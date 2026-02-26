import type { WordId } from '@dom/dataset'
import type { WordProgress } from '@dom/stats'
import type { WordAttempt, GroupAttempt } from '@dom/drill'
import type { ChineseWord } from '@dom/kind/chinese/dataset'
import type { CharAttempt } from '@dom/kind/chinese/drill'
import { diacriticToToneNumber, splitPinyin } from '@std/kind/chinese/pinyin.js'

const isHanChar = (ch: string) => /[\u4e00-\u9fff]/.test(ch)

export class DrillPinyinSession {
  // --- Callbacks ---
  private onWordDone: (attempt: WordAttempt, chars: CharAttempt[]) => void
  private onDrillDone: (result: GroupAttempt) => void

  // --- Session flow ---
  items: ChineseWord[] = $state([])
  wordProgress: Map<WordId, WordProgress> = $state(new Map())
  currentIndex: number = $state(0)
  completedWords: Set<number> = $state(new Set())
  drilledCount: number = $state(0)
  skippedCount: number = $state(0)
  sessionDone: boolean = $state(false)

  // --- Inter-word delay ---
  wordDelay: boolean = $state(false)
  wordDelayProgress: number = $state(100)

  // --- Char-level ---
  charIndex: number = $state(0)
  wordStartedAt: string | null = $state(null)
  charStartedAt: string | null = $state(null)
  charErrorCount: number = $state(0)
  charHintCount: number = $state(0)
  charData: CharAttempt[] = $state([])

  // --- UI ---
  showHint: boolean = $state(false)
  showTranslation: boolean = $state(false)
  pinyinInputValue: string = $state('')
  pinyinFeedback: 'fail' | null = $state(null)
  charDoneMap: Map<number, string> = $state(new Map())

  // --- Internal handles ---
  private delayTimerId: ReturnType<typeof setTimeout> | null = null
  private delayAnimationId: number | null = null

  // --- Derived ---
  readonly currentItem: ChineseWord | null = $derived.by(() => this.items[this.currentIndex] ?? null)
  readonly currentStat: WordProgress | null = $derived.by(() =>
    this.currentItem ? this.wordProgress.get(this.currentItem.id) ?? null : null,
  )
  readonly hanChars: string[] = $derived.by(() =>
    this.currentItem ? this.currentItem.word.split('').filter(isHanChar) : [],
  )
  readonly currentChar: string | null = $derived.by(() => this.hanChars[this.charIndex] ?? null)
  readonly pinyinSlots = $derived.by(() =>
    this.currentItem ? splitPinyin(this.currentItem.pinyin, this.currentItem.word) : [],
  )
  readonly progress: number = $derived.by(() =>
    this.items.length > 0 ? Math.round((this.completedWords.size / this.items.length) * 100) : 0,
  )

  constructor(opts: {
    items: ChineseWord[]
    wordProgress: Map<WordId, WordProgress>
    onWordDone: (attempt: WordAttempt, chars: CharAttempt[]) => void
    onDrillDone: (result: GroupAttempt) => void
  }) {
    this.items = opts.items
    this.wordProgress = new Map(opts.wordProgress)
    this.onWordDone = opts.onWordDone
    this.onDrillDone = opts.onDrillDone
    this.wordStartedAt = new Date().toISOString()
    this.charStartedAt = new Date().toISOString()
  }

  // --- Public methods ---

  submitInput(): void {
    const val = this.pinyinInputValue.trim().toLowerCase()
    if (!val || !/[1-5]/.test(val[val.length - 1])) return

    const slot = this.pinyinSlots[this.charIndex]
    if (!slot || slot.autoComplete) return

    if (val !== diacriticToToneNumber(slot.pinyin!).toLowerCase()) {
      this.charErrorCount += 1
      this.pinyinFeedback = 'fail'
      this.pinyinInputValue = ''
      setTimeout(() => { this.pinyinFeedback = null }, 400)
      return
    }

    const now = new Date().toISOString()
    this.charDoneMap = new Map([...this.charDoneMap, [this.charIndex, slot.pinyin!]])
    this.charData = [
      ...this.charData,
      { charIndex: this.charIndex, startedAt: this.charStartedAt!, doneAt: now, errorCount: this.charErrorCount, hintCount: this.charHintCount },
    ]

    let next = this.charIndex + 1
    while (next < this.pinyinSlots.length && this.pinyinSlots[next].autoComplete) {
      this.charDoneMap = new Map([...this.charDoneMap, [next, '']])
      this.charData = [...this.charData, { charIndex: next, startedAt: now, doneAt: now, errorCount: 0, hintCount: 0 }]
      next++
    }

    this.pinyinInputValue = ''
    if (next < this.hanChars.length) {
      this.charIndex = next
      this.charErrorCount = 0
      this.charHintCount = 0
      this.charStartedAt = now
    } else {
      this.completeWord()
    }
  }

  toggleHint(): void {
    if (!this.showHint) this.charHintCount += 1
    this.showHint = !this.showHint
  }

  skipWord(): void {
    this.clearDelay()
    this.completedWords = new Set([...this.completedWords, this.currentIndex])
    this.skippedCount += 1

    if (this.currentIndex < this.items.length - 1) {
      this.advanceToNext()
    } else {
      this.finishSession()
    }
  }

  skipDelay(): void {
    if (this.wordDelay) {
      this.clearDelay()
      this.advanceToNext()
    }
  }

  speak(text: string): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'zh-CN'
    utterance.rate = 0.8
    speechSynthesis.speak(utterance)
  }

  restart(): void {
    this.clearDelay()
    this.items = [...this.items].sort((a, b) => {
      const ca = this.wordProgress.get(a.id)?.successCount ?? 0
      const cb = this.wordProgress.get(b.id)?.successCount ?? 0
      return ca - cb
    })
    this.resetSessionState()
  }

  destroy(): void {
    this.clearDelay()
  }

  // --- Private ---

  private completeWord(): void {
    const item = this.currentItem
    if (!item) return

    const wordStartedAt = this.wordStartedAt!
    const wordDoneAt = new Date().toISOString()
    const chars = [...this.charData]
    this.charData = []

    this.completedWords = new Set([...this.completedWords, this.currentIndex])
    this.drilledCount += 1

    // Optimistic local update for UI freshness
    const drillMap = new Map(this.wordProgress)
    const existing = drillMap.get(item.id)
    const attemptErrors = chars.reduce((sum, c) => sum + (c.errorCount || 0), 0)
    const attemptHints = chars.reduce((sum, c) => sum + (c.hintCount || 0), 0)
    drillMap.set(item.id, {
      successCount: (existing?.successCount ?? 0) + 1,
      errorCount: (existing?.errorCount ?? 0) + attemptErrors,
      hintCount: (existing?.hintCount ?? 0) + attemptHints,
      lastDrilledAt: wordDoneAt,
    })
    this.wordProgress = drillMap

    const attempt: WordAttempt = { wordId: item.id, startedAt: wordStartedAt, doneAt: wordDoneAt }
    this.onWordDone(attempt, chars)

    this.startDelay(this.hanChars.length * 1000)
  }

  private finishSession(): void {
    this.sessionDone = true
    this.onDrillDone({ drilledCount: this.drilledCount, skippedCount: this.skippedCount })
  }

  private resetCharState(): void {
    this.charIndex = 0
    this.wordStartedAt = new Date().toISOString()
    this.charStartedAt = new Date().toISOString()
    this.charErrorCount = 0
    this.charHintCount = 0
    this.charData = []
    this.charDoneMap = new Map()
    this.pinyinFeedback = null
    this.pinyinInputValue = ''
  }

  private resetSessionState(): void {
    this.currentIndex = 0
    this.completedWords = new Set()
    this.drilledCount = 0
    this.skippedCount = 0
    this.sessionDone = false
    this.wordDelay = false
    this.wordDelayProgress = 100
    this.showHint = false
    this.resetCharState()
  }

  private clearDelay(): void {
    if (this.delayTimerId) { clearTimeout(this.delayTimerId); this.delayTimerId = null }
    if (this.delayAnimationId) { cancelAnimationFrame(this.delayAnimationId); this.delayAnimationId = null }
    this.wordDelay = false
    this.wordDelayProgress = 100
  }

  private startDelay(durationMs: number): void {
    this.clearDelay()
    const startTime = Date.now()
    this.wordDelay = true
    this.wordDelayProgress = 100

    const animate = () => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 100 - (elapsed / durationMs) * 100)
      this.wordDelayProgress = remaining
      if (remaining > 0) this.delayAnimationId = requestAnimationFrame(animate)
    }
    this.delayAnimationId = requestAnimationFrame(animate)

    this.delayTimerId = setTimeout(() => {
      this.clearDelay()
      this.advanceToNext()
    }, durationMs)
  }

  private advanceToNext(): void {
    this.clearDelay()
    if (this.currentIndex >= this.items.length - 1) {
      this.finishSession()
    } else {
      this.currentIndex += 1
      this.resetCharState()
    }
  }
}
