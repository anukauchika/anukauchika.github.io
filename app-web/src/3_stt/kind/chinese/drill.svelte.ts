import type { DatasetId, GroupId, WordId } from '@dom/dataset'
import type { WordProgress } from '@dom/stats'
import type { DrillId } from '@dom/drill'
import { ChineseDrillType } from '@dom/kind/chinese/dataset'
import type { ChineseWord } from '@dom/kind/chinese/dataset'
import type { CharAttempt } from '@dom/kind/chinese/drill'
import { sttDataset } from '@stt/dataset.svelte.js'
import { sttAuth } from '@stt/auth.svelte.js'
import { sttStats } from '@stt/kind/chinese/stats.svelte.js'
import { pickNextDrill } from '@std/kind/chinese/drill'
import { splitPinyin } from '@std/kind/chinese/pinyin.js'

const isHanChar = (ch: string) => /[\u4e00-\u9fff]/.test(ch)

class DrillState {
  // Session identity
  drillId: DrillId | null = $state(null)
  datasetId: DatasetId = $state('')
  drillType: ChineseDrillType = $state(ChineseDrillType.Stroke)
  groupId: GroupId = $state(0)

  // Per-word progress for current group
  wordProgress: Map<WordId, WordProgress> = $state(new Map())

  // Session flow
  items: ChineseWord[] = $state([])
  currentIndex: number = $state(0)
  completedWords: Set<number> = $state(new Set())
  drilledCount: number = $state(0)
  skippedCount: number = $state(0)
  sessionDone: boolean = $state(false)

  // Inter-word delay
  wordDelay: boolean = $state(false)
  wordDelayProgress: number = $state(100)

  // Char-level
  charIndex: number = $state(0)
  wordStartedAt: string | null = $state(null)
  charStartedAt: string | null = $state(null)
  charErrorCount: number = $state(0)
  charData: CharAttempt[] = $state([])

  // UI — shared
  showHint: boolean = $state(false)
  hintManuallySet: boolean = $state(false)

  // UI — pinyin
  pinyinInputValue: string = $state('')
  pinyinFeedback: 'fail' | null = $state(null)
  charDoneMap: Map<number, string> = $state(new Map())
  showTranslation: boolean = $state(true)

  // UI — stroke
  showPinyin: boolean = $state(true)
  strokeQuizResult: 'correct' | null = $state(null)

  // Internal handles (non-reactive, managed by svcDrill)
  sessionIdPromise: Promise<DrillId> | null = null
  delayTimerId: ReturnType<typeof setTimeout> | null = null
  delayAnimationId: number | null = null
  charDelayTimerId: ReturnType<typeof setTimeout> | null = null
  writer: any = null

  // Derived — session
  readonly currentItem: ChineseWord | null = $derived.by(() => this.items[this.currentIndex] ?? null)
  readonly currentStat: WordProgress | null = $derived.by(() =>
    this.currentItem ? this.wordProgress.get(this.currentItem.id) ?? null : null,
  )
  readonly hanChars: string[] = $derived.by(() =>
    this.currentItem ? this.currentItem.word.split('').filter(isHanChar) : [],
  )
  readonly progress: number = $derived.by(() =>
    this.items.length > 0 ? Math.round((this.completedWords.size / this.items.length) * 100) : 0,
  )

  // Derived — char
  readonly currentChar: string | null = $derived.by(() => this.hanChars[this.charIndex] ?? null)
  readonly pinyinSlots = $derived.by(() =>
    this.currentItem ? splitPinyin(this.currentItem.pinyin, this.currentItem.word) : [],
  )

  // Next drill suggestion
  readonly nextDrill = $derived.by(() => {
    if (sttAuth.isAuthenticated) return pickNextDrill(
      sttDataset.filtered,
      sttStats.groupProgress,
      sttStats.groupProgressStroke,
      sttStats.groupProgressPinyin,
    )
    return sttDataset.filtered.length > 0 ? { groupId: sttDataset.filtered[0].id, type: 'stroke' as const } : null
  })
}

export const sttDrill = new DrillState()
