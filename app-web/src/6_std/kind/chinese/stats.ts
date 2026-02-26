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
  const fullSessions = sessionsMap.get(group.id)?.full ?? 0
  return Math.min(Math.round((fullSessions / 10) * 100), 100)
}

// --- Sorting ---

export function countOverdueGroups(
  groups: ChineseGroup[],
  strokeProgress: Map<GroupId, GroupProgress>,
  pinyinProgress: Map<GroupId, GroupProgress>,
  strokeWordProgress: Map<WordKey, WordProgress>,
  pinyinWordProgress: Map<WordKey, WordProgress>,
): number {
  return groups.filter(g => {
    const score = calcGroupOverdueScore(strokeProgress.get(g.id), pinyinProgress.get(g.id), g, strokeWordProgress, pinyinWordProgress)
    return isFinite(score) && score >= 1
  }).length
}

export function sortGroupsByLastDrilled(groups: ChineseGroup[], sessionsMap: Map<GroupId, GroupProgress>): ChineseGroup[] {
  return [...groups].sort((a, b) => {
    const tA = sessionsMap.get(a.id)?.lastDrilledAt ?? ''
    const tB = sessionsMap.get(b.id)?.lastDrilledAt ?? ''
    return tB.localeCompare(tA)
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

export function calcWordDifficulty(wp: WordProgress): number {
  const errorRate = wp.errorCount / Math.max(1, wp.successCount + wp.errorCount)
  const hintRate = (wp.hintCount ?? 0) / Math.max(1, wp.successCount + (wp.hintCount ?? 0))
  return Math.min(1, 0.4 * errorRate + 0.7 * hintRate)
}

export function calcWordSortScore(wp: WordProgress | undefined, drillType: ChineseDrillType): number {
  const errorWeight = DRILL_ERROR_WEIGHT[drillType]
  const resolved = wp ?? { successCount: 0, errorCount: 0, hintCount: 0, lastDrilledAt: null }
  const errorRate = resolved.errorCount / Math.max(1, resolved.successCount + resolved.errorCount)
  const hintRate = (resolved.hintCount ?? 0) / Math.max(1, resolved.successCount + (resolved.hintCount ?? 0))
  const difficulty = Math.min(1, errorWeight * errorRate + 0.7 * hintRate)
  return resolved.successCount * (1 - difficulty * DIFFICULTY_SORT_IMPACT)
}

export function calcGroupDifficulty(group: ChineseGroup, wordProgress: Map<WordKey, WordProgress>): number {
  let sum = 0
  let count = 0
  for (const item of group.items) {
    const wp = wordProgress.get(mkWordKey(group.id, item.id))
    if (wp) { sum += calcWordDifficulty(wp); count++ }
  }
  return count > 0 ? sum / count : 0
}

export function calcGroupHintDifficulty(group: ChineseGroup, wordProgress: Map<WordKey, WordProgress>): number {
  let sum = 0
  let count = 0
  for (const item of group.items) {
    const wp = wordProgress.get(mkWordKey(group.id, item.id))
    if (wp) {
      const hintRate = (wp.hintCount ?? 0) / Math.max(1, wp.successCount + (wp.hintCount ?? 0))
      sum += 0.7 * hintRate
      count++
    }
  }
  return count > 0 ? sum / count : 0
}

export function calcTypeDue(gp: GroupProgress | undefined, difficulty: number = 0): DueInfo | null {
  if (!gp || gp.full === 0 || !gp.lastFullDrillAt) return null
  return dueIn(gp.lastFullDrillAt, calcEffectiveInterval(gp.full, difficulty))
}

// Returns expected review interval in days. full=0 → Infinity (not yet started).
export function calcExpectedInterval(full: number): number {
  if (full <= 0) return Infinity
  return Math.min(Math.pow(2, full - 1), 90)
}

// Shrinks expected interval for harder groups (difficulty 0–1).
export function calcEffectiveInterval(full: number, difficulty: number): number {
  const expected = calcExpectedInterval(full)
  if (!isFinite(expected)) return Infinity
  return expected * Math.max(0.4, 1 - 0.5 * difficulty)
}

// elapsed_days / expectedInterval for one drill type. full=0 or no lastFullDrillAt → Infinity.
export function calcOverdueScore(gp: GroupProgress, effectiveInterval: number): number {
  if (!isFinite(effectiveInterval) || !gp.lastFullDrillAt) return Infinity
  const elapsedMs = Date.now() - new Date(gp.lastFullDrillAt).getTime()
  const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24)
  return elapsedDays / effectiveInterval
}

// Overdue score for a single drill type. Undefined/full=0 → Infinity.
export function calcTypeOverdueScore(gp: GroupProgress | undefined, difficulty: number = 0): number {
  if (!gp) return Infinity
  return calcOverdueScore(gp, calcEffectiveInterval(gp.full, difficulty))
}

// Group overdue score = max across drill types. Either type being overdue surfaces the group.
export function calcGroupOverdueScore(
  gpStroke: GroupProgress | undefined,
  gpPinyin: GroupProgress | undefined,
  group: ChineseGroup,
  strokeWordProgress: Map<WordKey, WordProgress>,
  pinyinWordProgress: Map<WordKey, WordProgress>,
): number {
  const strokeDiff = calcGroupHintDifficulty(group, strokeWordProgress)
  const pinyinDiff = calcGroupHintDifficulty(group, pinyinWordProgress)
  return Math.max(calcTypeOverdueScore(gpStroke, strokeDiff), calcTypeOverdueScore(gpPinyin, pinyinDiff))
}

export function sortGroupsByOverdue(
  groups: ChineseGroup[],
  strokeProgress: Map<GroupId, GroupProgress>,
  pinyinProgress: Map<GroupId, GroupProgress>,
  strokeWordProgress: Map<WordKey, WordProgress>,
  pinyinWordProgress: Map<WordKey, WordProgress>,
): ChineseGroup[] {
  return [...groups].sort((a, b) => {
    const gsA = strokeProgress.get(a.id)
    const gpA = pinyinProgress.get(a.id)
    const gsB = strokeProgress.get(b.id)
    const gpB = pinyinProgress.get(b.id)
    const isActiveA = (gsA?.full ?? 0) >= 1 || (gpA?.full ?? 0) >= 1
    const isActiveB = (gsB?.full ?? 0) >= 1 || (gpB?.full ?? 0) >= 1
    // Inactive groups (neither type ever completed) go last, ordered by id
    if (!isActiveA && !isActiveB) return a.id - b.id
    if (!isActiveA) return 1
    if (!isActiveB) return -1
    const scoreA = calcGroupOverdueScore(gsA, gpA, a, strokeWordProgress, pinyinWordProgress)
    const scoreB = calcGroupOverdueScore(gsB, gpB, b, strokeWordProgress, pinyinWordProgress)
    if (!isFinite(scoreA) && !isFinite(scoreB)) return a.id - b.id
    if (!isFinite(scoreA)) return -1
    if (!isFinite(scoreB)) return 1
    return scoreB - scoreA
  })
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
