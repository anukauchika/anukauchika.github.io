import type { ChineseGroup, ChineseWord, ChineseDatasetStats } from '@dom/kind/chinese/dataset'
import { ChineseDrillType } from '@dom/kind/chinese/dataset'
import type { GroupId, WordKey } from '@dom/dataset'
import { mkWordKey } from '@dom/dataset'
import type { WordProgress, GroupProgress, DayKey, DayProgress } from '@dom/stats'
import { toLocalDateKey, dueIn } from '@std/format'
import type { DueInfo } from '@std/format'

// --- Types ---

export interface CharStatEntry {
  char: string
  wordCount: number
  stroke: { successCount: number; errorCount: number }
  pinyin: { successCount: number; errorCount: number }
  lastDrilledAt: string | null
  drilled: boolean
}

export interface DrilledItem {
  item: ChineseWord
  group: ChineseGroup
  stat: WordProgress
}

export interface ChartBar {
  date: string
  count: number
  label: string
  monthLabel: string | null
}

export interface ChartData {
  bars: ChartBar[]
  maxCount: number
  cumulativeData: number[]
  maxCumulative: number
  yMax: number
  ticks: number[]
}

// --- Helpers ---

const isCJK = (c: string): boolean => c >= '\u4E00' && c <= '\u9FFF'

// --- Dataset stats ---

export function uniqueChars(groups: ChineseGroup[]): Set<string> {
  const chars = new Set<string>()
  for (const g of groups) {
    for (const item of g.items) {
      for (const c of item.word) {
        if (isCJK(c)) chars.add(c)
      }
    }
  }
  return chars
}

export function uniqueWords(groups: ChineseGroup[]): number {
  const words = new Set<string>()
  for (const g of groups) {
    for (const item of g.items) words.add(item.word)
  }
  return words.size
}

export function calcDatasetStats(groups: ChineseGroup[]): ChineseDatasetStats {
  return {
    groups: groups.length,
    words: groups.reduce((sum, g) => sum + g.items.length, 0),
    uniqueWords: uniqueWords(groups),
    chars: uniqueChars(groups).size,
  }
}

export function calcAvgDailyTime(dayProgress: Map<DayKey, DayProgress>): number {
  if (dayProgress.size === 0) return 0
  let totalMs = 0
  for (const dp of dayProgress.values()) totalMs += dp.durationMs
  return Math.round(totalMs / dayProgress.size)
}

// --- Drill counts ---

export function countDrilled(groups: ChineseGroup[], statsMap: Map<WordKey, WordProgress>): number {
  let count = 0
  for (const g of groups) {
    for (const item of g.items) {
      if (statsMap.has(mkWordKey(g.id, item.id))) count++
    }
  }
  return count
}

export function buildDrilledItems(groups: ChineseGroup[], statsMap: Map<WordKey, WordProgress>): DrilledItem[] {
  const items: DrilledItem[] = []
  for (const g of groups) {
    for (const item of g.items) {
      const stat = statsMap.get(mkWordKey(g.id, item.id))
      if (stat) items.push({ item, group: g, stat })
    }
  }
  items.sort((a, b) => (b.stat.lastDrilledAt ?? '').localeCompare(a.stat.lastDrilledAt ?? ''))
  return items
}

// --- Char-level stats ---

export function buildDrilledCharsData(
  groups: ChineseGroup[],
  strokeStats: Map<WordKey, WordProgress>,
  pinyinStats: Map<WordKey, WordProgress>,
): CharStatEntry[] {
  const addStat = (obj: { successCount: number; errorCount: number }, stat: WordProgress | undefined) => {
    if (!stat) return
    obj.successCount += stat.successCount ?? 0
    obj.errorCount += stat.errorCount ?? 0
  }
  const emptyStat = () => ({ successCount: 0, errorCount: 0 })
  const charMap = new Map<string, CharStatEntry>()

  for (const g of groups) {
    for (const item of g.items) {
      const key = mkWordKey(g.id, item.id)
      const sStat = strokeStats.get(key)
      const pStat = pinyinStats.get(key)
      const hasStat = sStat || pStat
      for (const char of item.word) {
        if (!isCJK(char)) continue
        const existing = charMap.get(char)
        if (existing) {
          existing.wordCount++
          if (hasStat) {
            existing.drilled = true
            addStat(existing.stroke, sStat)
            addStat(existing.pinyin, pStat)
            const lp = (sStat?.lastDrilledAt ?? '') > (pStat?.lastDrilledAt ?? '') ? sStat?.lastDrilledAt : pStat?.lastDrilledAt
            if (lp && (!existing.lastDrilledAt || lp > existing.lastDrilledAt)) {
              existing.lastDrilledAt = lp
            }
          }
        } else {
          const stroke = emptyStat()
          const pinyin = emptyStat()
          addStat(stroke, sStat)
          addStat(pinyin, pStat)
          const lp = (sStat?.lastDrilledAt ?? '') > (pStat?.lastDrilledAt ?? '') ? sStat?.lastDrilledAt : pStat?.lastDrilledAt
          charMap.set(char, {
            char,
            wordCount: 1,
            stroke,
            pinyin,
            lastDrilledAt: lp ?? null,
            drilled: !!hasStat,
          })
        }
      }
    }
  }

  const chars = Array.from(charMap.values())
  chars.sort((a, b) => (b.lastDrilledAt ?? '').localeCompare(a.lastDrilledAt ?? ''))
  return chars
}

// --- Progress / Mastery ---

export function calcProgress(groups: ChineseGroup[], statsMap: Map<WordKey, WordProgress>): number {
  const total = groups.reduce((sum, g) => sum + g.items.length, 0)
  if (total === 0) return 0
  return Math.round((countDrilled(groups, statsMap) / total) * 100)
}

export function calcMastery(groups: ChineseGroup[], statsMap: Map<WordKey, WordProgress>): number {
  const total = groups.reduce((sum, g) => sum + g.items.length, 0)
  if (total === 0) return 0
  let sum = 0
  for (const g of groups) {
    for (const item of g.items) {
      const stat = statsMap.get(mkWordKey(g.id, item.id))
      sum += Math.min((stat?.successCount ?? 0) / 10, 1)
    }
  }
  return Math.round((sum / total) * 100)
}

export function calcGroupProgress(group: ChineseGroup, statsMap: Map<WordKey, WordProgress>): number {
  const drilled = group.items.filter(item =>
    statsMap.has(mkWordKey(group.id, item.id))
  ).length
  return group.items.length > 0 ? Math.round((drilled / group.items.length) * 100) : 0
}

export function calcGroupMastery(group: ChineseGroup, sessionsMap: Map<GroupId, GroupProgress>): number {
  const cleanSessions = sessionsMap.get(group.id)?.clean ?? 0
  return Math.min(Math.round((cleanSessions / 10) * 100), 100)
}

// --- Sorting ---

export function countDueDrills(
  groups: ChineseGroup[],
  strokeProgress: Map<GroupId, GroupProgress>,
  pinyinProgress: Map<GroupId, GroupProgress>,
): number {
  return groups.reduce((sum, g) => {
    const stroke = calcTypeReview(strokeProgress.get(g.id))
    const pinyin = calcTypeReview(pinyinProgress.get(g.id))
    return sum
      + (stroke.state === 'repeat' || stroke.state === 'due' ? 1 : 0)
      + (pinyin.state === 'repeat' || pinyin.state === 'due' ? 1 : 0)
  }, 0)
}

function isInProgressReview(review: TypeReview): boolean {
  if (review.state === 'new') return false
  if (review.state === 'repeat' || review.state === 'due') return true
  return review.intervalDays !== null && review.intervalDays < 256
}

export function countGroupsInProgress(
  groups: ChineseGroup[],
  strokeProgress: Map<GroupId, GroupProgress>,
  pinyinProgress: Map<GroupId, GroupProgress>,
): number {
  return groups.filter((g) =>
    isInProgressReview(calcTypeReview(strokeProgress.get(g.id))) ||
    isInProgressReview(calcTypeReview(pinyinProgress.get(g.id)))
  ).length
}

export function sortGroupsByReview(
  groups: ChineseGroup[],
  strokeProgress: Map<GroupId, GroupProgress>,
  pinyinProgress: Map<GroupId, GroupProgress>,
): ChineseGroup[] {
  return [...groups].sort((a, b) => {
    const aPriority = calcGroupReviewPriority(strokeProgress.get(a.id), pinyinProgress.get(a.id))
    const bPriority = calcGroupReviewPriority(strokeProgress.get(b.id), pinyinProgress.get(b.id))
    if (aPriority.rank !== bPriority.rank) return aPriority.rank - bPriority.rank
    if (aPriority.dueAt !== bPriority.dueAt) return aPriority.dueAt - bPriority.dueAt
    if (aPriority.queuedAt !== bPriority.queuedAt) return aPriority.queuedAt - bPriority.queuedAt
    return a.id - b.id
  })
}

// --- Spaced Repetition ---

// Stroke errors count less — they are expected during character learning.
// Pinyin errors are a stronger signal of not knowing the word.
const DRILL_ERROR_WEIGHT: Record<ChineseDrillType, number> = {
  [ChineseDrillType.Stroke]: 0.2,
  [ChineseDrillType.Pinyin]: 0.4,
}
// Difficulty can reduce effective success count by at most 50%.
const DIFFICULTY_SORT_IMPACT = 0.5

export function calcWordSortScore(wp: WordProgress | undefined, drillType: ChineseDrillType): number {
  const errorWeight = DRILL_ERROR_WEIGHT[drillType]
  const resolved = wp ?? { successCount: 0, errorCount: 0, hintCount: 0, lastDrilledAt: null }
  const errorRate = resolved.errorCount / Math.max(1, resolved.successCount + resolved.errorCount)
  const hintRate = (resolved.hintCount ?? 0) / Math.max(1, resolved.successCount + (resolved.hintCount ?? 0))
  const difficulty = Math.min(1, errorWeight * errorRate + 0.7 * hintRate)
  return resolved.successCount * (1 - difficulty * DIFFICULTY_SORT_IMPACT)
}

export type ReviewState = 'new' | 'repeat' | 'due' | 'upcoming'

export interface TypeReview {
  state: ReviewState
  dueAt: number
  queuedAt: number
  intervalDays: number | null
}

interface GroupReviewPriority {
  rank: number
  dueAt: number
  queuedAt: number
}

function ts(value: string | null | undefined, fallback: number): number {
  if (!value) return fallback
  const time = new Date(value).getTime()
  return Number.isFinite(time) ? time : fallback
}

export function calcReviewInterval(cleanCount: number): number | null {
  if (cleanCount <= 0) return null
  return Math.pow(2, cleanCount - 1)
}

export function calcTypeReview(gp: GroupProgress | undefined): TypeReview {
  if (!gp || gp.full === 0) {
    return { state: 'new', dueAt: Infinity, queuedAt: Infinity, intervalDays: null }
  }

  const queuedAt = ts(gp.firstDrilledAt, Infinity)
  if ((gp.lastSessionHintCount ?? 0) > 0) {
    return { state: 'repeat', dueAt: ts(gp.lastFullDrillAt, 0), queuedAt, intervalDays: null }
  }

  const intervalDays = calcReviewInterval(gp.clean)
  if (!intervalDays || !gp.lastCleanDrillAt) {
    return { state: 'repeat', dueAt: ts(gp.lastFullDrillAt, 0), queuedAt, intervalDays: null }
  }

  const dueAt = new Date(gp.lastCleanDrillAt).getTime() + intervalDays * 24 * 60 * 60 * 1000
  return { state: dueAt <= Date.now() ? 'due' : 'upcoming', dueAt, queuedAt, intervalDays }
}

export function calcTypeDue(gp: GroupProgress | undefined): DueInfo | null {
  const review = calcTypeReview(gp)
  if (review.state === 'new') return null
  if (review.state === 'repeat') return { label: 'repeat', status: 'due-now' }
  if (!gp?.lastCleanDrillAt || !review.intervalDays) return null
  return dueIn(gp.lastCleanDrillAt, review.intervalDays)
}

function typeRank(review: TypeReview, inactiveRank: number): number {
  if (review.state === 'repeat') return 0
  if (review.state === 'due') return 1
  if (review.state === 'upcoming') return 2
  return inactiveRank
}

export function calcGroupReviewPriority(
  gpStroke: GroupProgress | undefined,
  gpPinyin: GroupProgress | undefined,
): GroupReviewPriority {
  const stroke = calcTypeReview(gpStroke)
  const pinyin = calcTypeReview(gpPinyin)
  const active = stroke.state !== 'new' || pinyin.state !== 'new'
  if (!active) return { rank: 4, dueAt: Infinity, queuedAt: Infinity }

  const inactiveRank = 3
  const strokeRank = typeRank(stroke, inactiveRank)
  const pinyinRank = typeRank(pinyin, inactiveRank)
  const bestRank = Math.min(strokeRank, pinyinRank)
  const dueAt = Math.min(
    strokeRank === bestRank ? stroke.dueAt : Infinity,
    pinyinRank === bestRank ? pinyin.dueAt : Infinity,
  )
  const queuedAt = Math.min(stroke.queuedAt, pinyin.queuedAt)
  return { rank: bestRank, dueAt, queuedAt }
}

// --- Chart ---

export function buildChartData(drilledItems: DrilledItem[], dayCounts: Map<DayKey, DayProgress>): ChartData | null {
  if (drilledItems.length === 0) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const DAYS = 30

  const bars: ChartBar[] = []
  let maxCount = 0
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = toLocalDateKey(d)
    const entry = dayCounts.get(key) || { count: 0, durationMs: 0, sessions: 0 }
    const count = entry.count
    if (count > maxCount) maxCount = count
    bars.push({
      date: key,
      count,
      label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      monthLabel: d.getDate() === 1 || i === DAYS - 1
        ? d.toLocaleDateString('en-US', { month: 'short' })
        : null
    })
  }

  const cumulativeData: number[] = []
  let maxCumulative = 0
  for (const bar of bars) {
    let cum = 0
    for (const { stat } of drilledItems) {
      if (stat.lastDrilledAt && toLocalDateKey(new Date(stat.lastDrilledAt)) <= bar.date) cum++
    }
    cumulativeData.push(cum)
    if (cum > maxCumulative) maxCumulative = cum
  }

  const yMax = Math.max(maxCount, maxCumulative)

  const niceStep = (max: number): number[] => {
    if (max <= 0) return []
    const rough = max / 4
    const mag = Math.pow(10, Math.floor(Math.log10(rough)))
    const candidates = [1, 2, 5, 10].map(m => m * mag)
    const step = candidates.find(s => s >= rough) || candidates[candidates.length - 1]
    const ticks: number[] = []
    for (let v = step; v <= max; v += step) ticks.push(v)
    return ticks
  }

  return { bars, maxCount, cumulativeData, maxCumulative, yMax, ticks: niceStep(yMax) }
}
