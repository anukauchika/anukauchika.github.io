import type { GroupId, DatasetId, WordKey } from '@dom/dataset'
import { mkWordKey } from '@dom/dataset'
import type { WordProgress, GroupProgress } from '@dom/stats'
import type { WordAttempt } from '@dom/drill'
import { ChineseDrillType } from '@dom/kind/chinese/dataset'
import type { ChineseWord } from '@dom/kind/chinese/dataset'
import type { CharAttempt } from '@dom/kind/chinese/drill'
import { diacriticToToneNumber } from '@std/kind/chinese/pinyin.js'
import { datDrill } from '@dat/kind/chinese/drill'
import { sttDrill } from '@stt/kind/chinese/drill.svelte.js'
import { sttStats } from '@stt/kind/chinese/stats.svelte.js'
import { svcSync } from '@svc/sync'
import { dsCode, dtCode } from '@svc/kind/chinese/codes'

const DT_STORE_KEY: Record<string, 'wordProgressStroke' | 'wordProgressPinyin'> = {
  s: 'wordProgressStroke',
  p: 'wordProgressPinyin',
}

// --- Internal helpers ---

function sortByProgress(items: ChineseWord[], wp: Map<number, WordProgress>): ChineseWord[] {
  return [...items].sort((a, b) => {
    const ca = wp.get(a.id)?.successCount ?? 0
    const cb = wp.get(b.id)?.successCount ?? 0
    return ca - cb
  })
}

function resetCharState(): void {
  sttDrill.charIndex = 0
  sttDrill.wordStartedAt = new Date().toISOString()
  sttDrill.charStartedAt = new Date().toISOString()
  sttDrill.charErrorCount = 0
  sttDrill.charData = []
  sttDrill.charDoneMap = new Map()
  sttDrill.pinyinFeedback = null
  sttDrill.pinyinInputValue = ''
  sttDrill.strokeQuizResult = null
  sttDrill.hintManuallySet = false
}

function resetSessionState(): void {
  sttDrill.currentIndex = 0
  sttDrill.completedWords = new Set()
  sttDrill.drilledCount = 0
  sttDrill.skippedCount = 0
  sttDrill.sessionDone = false
  sttDrill.wordDelay = false
  sttDrill.wordDelayProgress = 100
  sttDrill.showHint = false
  sttDrill.sessionIdPromise = null
  resetCharState()
}

function clearDelay(): void {
  if (sttDrill.delayTimerId) { clearTimeout(sttDrill.delayTimerId); sttDrill.delayTimerId = null }
  if (sttDrill.delayAnimationId) { cancelAnimationFrame(sttDrill.delayAnimationId); sttDrill.delayAnimationId = null }
  sttDrill.wordDelay = false
  sttDrill.wordDelayProgress = 100
}

function clearCharDelay(): void {
  if (sttDrill.charDelayTimerId) { clearTimeout(sttDrill.charDelayTimerId); sttDrill.charDelayTimerId = null }
}

function startDelay(durationMs: number): void {
  clearDelay()
  const startTime = Date.now()
  sttDrill.wordDelay = true
  sttDrill.wordDelayProgress = 100

  const animate = () => {
    const elapsed = Date.now() - startTime
    const remaining = Math.max(0, 100 - (elapsed / durationMs) * 100)
    sttDrill.wordDelayProgress = remaining
    if (remaining > 0) sttDrill.delayAnimationId = requestAnimationFrame(animate)
  }
  sttDrill.delayAnimationId = requestAnimationFrame(animate)

  sttDrill.delayTimerId = setTimeout(() => {
    clearDelay()
    advanceToNext()
  }, durationMs)
}

function advanceToNext(): void {
  clearDelay()
  sttDrill.currentIndex += 1
  resetCharState()
  applyAutoHint()
}

function applyAutoHint(): void {
  if (!sttDrill.hintManuallySet && sttDrill.drillType === ChineseDrillType.Stroke) {
    sttDrill.showHint = (sttDrill.currentStat?.successCount ?? 0) === 0
  }
}

function completeWord(): void {
  const item = sttDrill.currentItem
  if (!item) return

  const wordStartedAt = sttDrill.wordStartedAt!
  const wordDoneAt = new Date().toISOString()
  const chars = [...sttDrill.charData]
  sttDrill.charData = []

  sttDrill.completedWords = new Set([...sttDrill.completedWords, sttDrill.currentIndex])
  sttDrill.drilledCount += 1

  import('@stt/auth.svelte.js').then(({ sttAuth }) => {
    if (!sttAuth.isAuthenticated) return

    if (!sttDrill.sessionIdPromise) {
      sttDrill.sessionIdPromise = datDrill.startDrill(
        sttAuth.user?.id ?? null,
        dsCode(sttDrill.datasetId), dtCode(sttDrill.drillType), sttDrill.groupId,
      ).then((id) => { sttDrill.drillId = id; return id })
    }

    sttDrill.sessionIdPromise
      .then((sid) => {
        const attempt: WordAttempt = { wordId: item.id, startedAt: wordStartedAt, doneAt: wordDoneAt }
        return datDrill.recordAttempt(sid, attempt, chars)
      })
      .then((result) => {
        svcSync.syncPending().catch((e) => console.error('sync failed', e))
        updateWordProgressOptimistic(item.id, wordDoneAt, result.errorCount)
      })
      .catch((e) => console.error('recordWordAttempt failed', e))
  })

  if (sttDrill.currentIndex < sttDrill.items.length - 1) {
    const delayMs = sttDrill.drillType === ChineseDrillType.Stroke
      ? 5000 : sttDrill.hanChars.length * 1000
    startDelay(delayMs)
  } else {
    finishSession()
  }
}

function updateWordProgressOptimistic(wordId: number, doneAt: string, attemptErrors: number): void {
  const drillMap = new Map(sttDrill.wordProgress)
  const existing = drillMap.get(wordId)
  drillMap.set(wordId, {
    successCount: (existing?.successCount ?? 0) + 1,
    errorCount: (existing?.errorCount ?? 0) + attemptErrors,
    lastDrilledAt: doneAt,
  })
  sttDrill.wordProgress = drillMap

  const key = mkWordKey(sttDrill.groupId, wordId)
  const drillCode = dtCode(sttDrill.drillType)
  const updateMap = (map: Map<WordKey, WordProgress>): Map<WordKey, WordProgress> => {
    const next = new Map(map)
    const ex = next.get(key)
    next.set(key, {
      successCount: (ex?.successCount ?? 0) + 1,
      errorCount: (ex?.errorCount ?? 0) + attemptErrors,
      lastDrilledAt: doneAt,
    })
    return next
  }
  sttStats.wordProgress = updateMap(sttStats.wordProgress)
  const wpStoreKey = DT_STORE_KEY[drillCode]
  if (wpStoreKey) sttStats[wpStoreKey] = updateMap(sttStats[wpStoreKey])
}

function updateGroupProgressOptimistic(doneAt: string): void {
  const drillCode = dtCode(sttDrill.drillType)
  const updateMap = (map: Map<number, GroupProgress>): Map<number, GroupProgress> => {
    const next = new Map(map)
    const existing = next.get(sttDrill.groupId)
    if (existing) {
      next.set(sttDrill.groupId, {
        ...existing, full: existing.full + 1,
        lastFullDrillAt: doneAt > (existing.lastFullDrillAt ?? '') ? doneAt : existing.lastFullDrillAt,
      })
    }
    return next
  }
  sttStats.groupProgress = updateMap(sttStats.groupProgress)
  const gpStoreKey = drillCode === 's' ? 'groupProgressStroke' : 'groupProgressPinyin'
  sttStats[gpStoreKey] = updateMap(sttStats[gpStoreKey] as Map<number, GroupProgress>)
}

async function finishSession(): Promise<void> {
  sttDrill.sessionDone = true
  if (sttDrill.drillId != null) {
    const session = await datDrill.endDrill(sttDrill.drillId)
    sttDrill.drillId = null
    if (session) {
      svcSync.syncPending().catch((e) => console.error('sync failed', e))
      updateGroupProgressOptimistic(session.done_at ?? new Date().toISOString())
    }
  }
  sttDrill.sessionIdPromise = null
}

// --- Public interface ---

async function initSession(datasetId: DatasetId, drillType: ChineseDrillType, groupId: GroupId, items: ChineseWord[]): Promise<void> {
  clearDelay()
  clearCharDelay()
  destroyStrokeQuiz()

  sttDrill.datasetId = datasetId
  sttDrill.drillType = drillType
  sttDrill.groupId = groupId

  const wp = await datDrill.getGroupWordsProgress(dsCode(datasetId), dtCode(drillType), groupId)
  sttDrill.wordProgress = wp
  sttDrill.items = sortByProgress(items, wp)

  resetSessionState()
  applyAutoHint()
}

function submitPinyinInput(): void {
  const val = sttDrill.pinyinInputValue.trim().toLowerCase()
  if (!val || !/[1-5]/.test(val[val.length - 1])) return

  const slot = sttDrill.pinyinSlots[sttDrill.charIndex]
  if (!slot || slot.autoComplete) return

  if (val !== diacriticToToneNumber(slot.pinyin!)) {
    sttDrill.charErrorCount += 1
    sttDrill.pinyinFeedback = 'fail'
    sttDrill.pinyinInputValue = ''
    setTimeout(() => { sttDrill.pinyinFeedback = null }, 400)
    return
  }

  const now = new Date().toISOString()
  sttDrill.charDoneMap = new Map([...sttDrill.charDoneMap, [sttDrill.charIndex, slot.pinyin!]])
  sttDrill.charData = [
    ...sttDrill.charData,
    { charIndex: sttDrill.charIndex, startedAt: sttDrill.charStartedAt!, doneAt: now, errorCount: sttDrill.charErrorCount },
  ]

  let next = sttDrill.charIndex + 1
  while (next < sttDrill.pinyinSlots.length && sttDrill.pinyinSlots[next].autoComplete) {
    sttDrill.charDoneMap = new Map([...sttDrill.charDoneMap, [next, '']])
    sttDrill.charData = [...sttDrill.charData, { charIndex: next, startedAt: now, doneAt: now, errorCount: 0 }]
    next++
  }

  sttDrill.pinyinInputValue = ''
  if (next < sttDrill.hanChars.length) {
    sttDrill.charIndex = next
    sttDrill.charErrorCount = 0
    sttDrill.charStartedAt = now
  } else {
    completeWord()
  }
}

function initStrokeQuiz(): void {
  destroyStrokeQuiz()
  if (!sttDrill.currentChar || !sttDrill.currentItem) return
  const target = document.getElementById('drill-canvas')
  if (!target) return

  if (sttDrill.charIndex === 0) speak(sttDrill.currentItem.word)

  sttDrill.charStartedAt = new Date().toISOString()
  sttDrill.charErrorCount = 0
  if (sttDrill.charIndex === 0) sttDrill.wordStartedAt = new Date().toISOString()

  import('hanzi-writer').then(({ default: HanziWriter }) => {
    if (!sttDrill.currentChar) return
    sttDrill.writer = HanziWriter.create(target, sttDrill.currentChar, {
      width: 280, height: 280, padding: 20,
      showCharacter: false, showOutline: sttDrill.showHint,
      strokeAnimationSpeed: 1, delayBetweenStrokes: 100,
      highlightOnComplete: false, drawingWidth: 20,
      leniency: 1.4, showHintAfterMisses: 2, radicalColor: '#1f6f5c',
    })
    sttDrill.writer.quiz({
      onMistake: () => { sttDrill.charErrorCount += 1 },
      onComplete: () => onStrokeCharComplete(),
    })
  })
}

function destroyStrokeQuiz(): void {
  if (sttDrill.writer) { sttDrill.writer.cancelQuiz(); sttDrill.writer = null }
  const target = document.getElementById('drill-canvas')
  if (target) target.innerHTML = ''
}

function onStrokeCharComplete(): void {
  const charDoneAt = new Date().toISOString()
  sttDrill.charData = [...sttDrill.charData, {
    charIndex: sttDrill.charIndex, startedAt: sttDrill.charStartedAt!,
    doneAt: charDoneAt, errorCount: sttDrill.charErrorCount,
  }]

  if (sttDrill.charIndex < sttDrill.hanChars.length - 1) {
    sttDrill.charDelayTimerId = setTimeout(() => {
      sttDrill.charIndex += 1
      sttDrill.charStartedAt = new Date().toISOString()
      sttDrill.charErrorCount = 0
    }, 1500)
  } else {
    sttDrill.strokeQuizResult = 'correct'
    completeWord()
  }
}

function repeatWord(): void {
  clearDelay()
  clearCharDelay()
  sttDrill.charData = []
  sttDrill.strokeQuizResult = null
  sttDrill.charIndex = 0
  sttDrill.wordStartedAt = new Date().toISOString()
  sttDrill.charStartedAt = new Date().toISOString()
  sttDrill.charErrorCount = 0
}

function toggleHint(): void {
  sttDrill.hintManuallySet = true
  sttDrill.showHint = !sttDrill.showHint
  if (sttDrill.writer) sttDrill.showHint ? sttDrill.writer.showOutline() : sttDrill.writer.hideOutline()
}

function skipWord(): void {
  clearDelay()
  clearCharDelay()
  destroyStrokeQuiz()
  sttDrill.completedWords = new Set([...sttDrill.completedWords, sttDrill.currentIndex])
  sttDrill.skippedCount += 1

  if (sttDrill.currentIndex < sttDrill.items.length - 1) {
    advanceToNext()
  } else {
    finishSession()
  }
}

function skipDelay(): void {
  if (sttDrill.wordDelay) {
    clearDelay()
    advanceToNext()
  }
}

async function restart(): Promise<void> {
  clearDelay()
  clearCharDelay()
  destroyStrokeQuiz()
  sttDrill.items = sortByProgress(sttDrill.items, sttDrill.wordProgress)
  resetSessionState()
  applyAutoHint()
}

function speak(text: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'zh-CN'
  utterance.rate = 0.8
  speechSynthesis.speak(utterance)
}

export interface DrillService {
  initSession(datasetId: DatasetId, drillType: ChineseDrillType, groupId: GroupId, items: ChineseWord[]): Promise<void>
  submitPinyinInput(): void
  initStrokeQuiz(): void
  destroyStrokeQuiz(): void
  repeatWord(): void
  toggleHint(): void
  skipWord(): void
  skipDelay(): void
  restart(): Promise<void>
  speak(text: string): void
}

export const svcDrill: DrillService = {
  initSession,
  submitPinyinInput,
  initStrokeQuiz,
  destroyStrokeQuiz,
  repeatWord,
  toggleHint,
  skipWord,
  skipDelay,
  restart,
  speak,
}
