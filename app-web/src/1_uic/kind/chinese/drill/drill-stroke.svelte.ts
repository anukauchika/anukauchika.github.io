import type { WordId } from '@dom/dataset'
import type { WordProgress } from '@dom/stats'
import type { WordAttempt, GroupAttempt } from '@dom/drill'
import type { ChineseWord } from '@dom/kind/chinese/dataset'
import type { CharAttempt } from '@dom/kind/chinese/drill'

const isHanChar = (ch: string) => /[\u4e00-\u9fff]/.test(ch)

export class DrillStrokeSession {
  // --- Callbacks ---
  private onWordDone: (attempt: WordAttempt, chars: CharAttempt[]) => void
  private onDrillDone: (result: GroupAttempt) => void | Promise<void>

  // --- Session flow ---
  items: ChineseWord[] = $state([])
  wordProgress: Map<WordId, WordProgress> = $state(new Map())
  currentIndex: number = $state(0)
  completedWords: Set<number> = $state(new Set())
  drilledCount: number = $state(0)
  skippedCount: number = $state(0)
  sessionDone: boolean = $state(false)
  sessionSaving: boolean = $state(false)

  // --- Inter-word delay ---
  wordDelay: boolean = $state(false)
  wordDelayProgress: number = $state(100)
  waitingForNext: boolean = $state(false)

  // --- Char-level ---
  charIndex: number = $state(0)
  wordStartedAt: string | null = $state(null)
  charStartedAt: string | null = $state(null)
  charErrorCount: number = $state(0)
  charHintCount: number = $state(0)
  charData: CharAttempt[] = $state([])

  // --- UI ---
  showHint: boolean = $state(false)
  hintManuallySet: boolean = $state(false)
  showPinyin: boolean = $state(true)
  strokeQuizResult: 'correct' | null = $state(null)
  quizKey: number = $state(0)
  acceptedStrokePaths: string[] = $state([])

  // --- Internal handles ---
  writer: any = null
  private delayTimerId: ReturnType<typeof setTimeout> | null = null
  private delayAnimationId: number | null = null
  private charDelayTimerId: ReturnType<typeof setTimeout> | null = null
  private hintLoopTimerId: ReturnType<typeof setInterval> | null = null
  private nextStrokeIndex = 0
  private initToken = 0

  // --- Derived ---
  readonly currentItem: ChineseWord | null = $derived.by(() => this.items[this.currentIndex] ?? null)
  readonly currentStat: WordProgress | null = $derived.by(() =>
    this.currentItem ? this.wordProgress.get(this.currentItem.id) ?? null : null,
  )
  readonly hanChars: string[] = $derived.by(() =>
    this.currentItem ? this.currentItem.word.split('').filter(isHanChar) : [],
  )
  readonly currentChar: string | null = $derived.by(() => this.hanChars[this.charIndex] ?? null)
  readonly progress: number = $derived.by(() =>
    this.items.length > 0 ? Math.round((this.completedWords.size / this.items.length) * 100) : 0,
  )

  constructor(opts: {
    items: ChineseWord[]
    wordProgress: Map<WordId, WordProgress>
    onWordDone: (attempt: WordAttempt, chars: CharAttempt[]) => void
    onDrillDone: (result: GroupAttempt) => void | Promise<void>
  }) {
    this.items = opts.items
    this.wordProgress = new Map(opts.wordProgress)
    this.onWordDone = opts.onWordDone
    this.onDrillDone = opts.onDrillDone
    this.applyAutoHint()
  }

  // --- Public methods ---

  initStrokeQuiz(): void {
    this.destroyStrokeQuiz()
    this.acceptedStrokePaths = []
    if (!this.currentChar || !this.currentItem) return
    const target = document.getElementById('drill-canvas')
    if (!target) return

    if (this.charIndex === 0) this.speak(this.currentItem.word)

    this.charStartedAt = new Date().toISOString()
    this.charErrorCount = 0
    if (this.showHint) this.charHintCount = Math.max(this.charHintCount, 1)
    if (this.charIndex === 0) this.wordStartedAt = new Date().toISOString()

    const token = this.initToken
    import('hanzi-writer').then(({ default: HanziWriter }) => {
      if (token !== this.initToken || !this.currentChar) return
      const styles = getComputedStyle(document.documentElement)
      const strokeColor = styles.getPropertyValue('--anuka-color-text').trim()
      const outlineColor = styles.getPropertyValue('--anuka-color-bg-accent').trim()
      const radicalColor = styles.getPropertyValue('--anuka-color-primary').trim()
      this.writer = HanziWriter.create(target, this.currentChar, {
        width: 280, height: 280, padding: 20,
        showCharacter: false, showOutline: this.showHint,
        strokeAnimationSpeed: 1, delayBetweenStrokes: 100,
        highlightOnComplete: false, drawingWidth: 10,
        leniency: 1.4, showHintAfterMisses: 2,
        strokeHighlightSpeed: 0.5,
        strokeColor: 'rgba(0, 0, 0, 0)', drawingColor: strokeColor, outlineColor,
        radicalColor: 'rgba(0, 0, 0, 0)',
        highlightColor: strokeColor,
      })
      this.nextStrokeIndex = 0
      this.writer.quiz({
        onMistake: () => { this.charErrorCount += 1 },
        onCorrectStroke: (data: { strokeNum: number; drawnPath: { pathString: string } }) => {
          this.acceptedStrokePaths = [...this.acceptedStrokePaths, data.drawnPath.pathString]
          this.nextStrokeIndex = data.strokeNum + 1
          this.restartHintLoop()
        },
        onComplete: () => this.onStrokeCharComplete(),
      })
      this.restartHintLoop()
    })
  }

  destroyStrokeQuiz(): void {
    this.initToken += 1
    this.clearHintLoop()
    if (this.writer) { this.writer.cancelQuiz(); this.writer = null }
    const target = document.getElementById('drill-canvas')
    if (target) target.innerHTML = ''
  }

  repeatWord(): void {
    this.clearDelay()
    this.clearCharDelay()
    this.waitingForNext = false
    this.charData = []
    this.strokeQuizResult = null
    this.charIndex = 0
    this.quizKey += 1
    this.wordStartedAt = new Date().toISOString()
    this.charStartedAt = new Date().toISOString()
    this.charErrorCount = 0
  }

  advanceFromNext(): void {
    this.waitingForNext = false
    this.advanceToNext()
  }

  toggleHint(): void {
    this.hintManuallySet = true
    if (!this.showHint) this.charHintCount += 1
    this.showHint = !this.showHint
    if (this.writer) this.showHint ? this.writer.showOutline() : this.writer.hideOutline()
    this.restartHintLoop()
  }

  skipWord(): void {
    this.clearDelay()
    this.clearCharDelay()
    this.destroyStrokeQuiz()
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
    this.clearCharDelay()
    this.destroyStrokeQuiz()
    this.items = [...this.items].sort((a, b) => {
      const ca = this.wordProgress.get(a.id)?.successCount ?? 0
      const cb = this.wordProgress.get(b.id)?.successCount ?? 0
      return ca - cb
    })
    this.resetSessionState()
    this.applyAutoHint()
  }

  destroy(): void {
    this.clearDelay()
    this.clearCharDelay()
    this.destroyStrokeQuiz()
  }

  // --- Private ---

  private onStrokeCharComplete(): void {
    this.clearHintLoop()
    const charDoneAt = new Date().toISOString()
    this.charData = [...this.charData, {
      charIndex: this.charIndex, startedAt: this.charStartedAt!,
      doneAt: charDoneAt, errorCount: this.charErrorCount, hintCount: this.charHintCount,
    }]

    if (this.charIndex < this.hanChars.length - 1) {
      this.charDelayTimerId = setTimeout(() => {
        this.charIndex += 1
        this.charStartedAt = new Date().toISOString()
        this.charErrorCount = 0
        this.charHintCount = 0
      }, 800)
    } else {
      this.strokeQuizResult = 'correct'
      this.completeWord()
    }
  }

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

    const hintUsed = this.showHint || chars.some(c => c.hintCount > 0)
    if (hintUsed) {
      this.waitingForNext = true
    } else {
      this.startDelay(this.hanChars.length * 1000)
    }
  }

  private async finishSession(): Promise<void> {
    if (this.sessionSaving || this.sessionDone) return
    this.sessionSaving = true
    try {
      await this.onDrillDone({ drilledCount: this.drilledCount, skippedCount: this.skippedCount })
    } finally {
      this.sessionSaving = false
    }
    this.sessionDone = true
  }

  private applyAutoHint(): void {
    if (!this.hintManuallySet) {
      this.showHint = (this.currentStat?.successCount ?? 0) === 0
    }
  }

  private resetCharState(): void {
    this.charIndex = 0
    this.wordStartedAt = new Date().toISOString()
    this.charStartedAt = new Date().toISOString()
    this.charErrorCount = 0
    this.charHintCount = 0
    this.charData = []
    this.strokeQuizResult = null
  }

  private resetSessionState(): void {
    this.currentIndex = 0
    this.completedWords = new Set()
    this.drilledCount = 0
    this.skippedCount = 0
    this.sessionDone = false
    this.sessionSaving = false
    this.wordDelay = false
    this.wordDelayProgress = 100
    this.showHint = false
    this.hintManuallySet = false
    this.resetCharState()
  }

  private clearDelay(): void {
    if (this.delayTimerId) { clearTimeout(this.delayTimerId); this.delayTimerId = null }
    if (this.delayAnimationId) { cancelAnimationFrame(this.delayAnimationId); this.delayAnimationId = null }
    this.wordDelay = false
    this.wordDelayProgress = 100
  }

  private clearCharDelay(): void {
    if (this.charDelayTimerId) { clearTimeout(this.charDelayTimerId); this.charDelayTimerId = null }
  }

  private clearHintLoop(): void {
    if (this.hintLoopTimerId) { clearInterval(this.hintLoopTimerId); this.hintLoopTimerId = null }
  }

  private restartHintLoop(): void {
    this.clearHintLoop()
    if (!this.showHint || !this.writer) return
    this.hintLoopTimerId = setInterval(() => {
      const writer = this.writer
      if (!writer) return
      const isRadical = writer._character?.strokes?.[this.nextStrokeIndex]?.isInRadical
      const color = isRadical ? writer._options.radicalColor : writer._options.strokeColor
      writer.updateColor('highlightColor', color, { duration: 0 }).then(() => {
        if (this.writer === writer) writer.highlightStroke(this.nextStrokeIndex)
      })
    }, 3000)
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
    this.waitingForNext = false
    if (this.currentIndex >= this.items.length - 1) {
      this.finishSession()
    } else {
      this.currentIndex += 1
      this.resetCharState()
      this.applyAutoHint()
    }
  }
}
