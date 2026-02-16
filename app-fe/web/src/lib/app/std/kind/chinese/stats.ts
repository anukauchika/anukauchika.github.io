import type { ChineseGroup, ChineseItem, ChineseDatasetStats } from '@app/api/data/kind/chinese/dataset'
import type { StatsMap, SessionsMap, StatEntry, DailyActivityMap } from '@app/api/services/kind/chinese/types'
import { toLocalDateKey } from '@std/format'

// --- Types ---

export interface CharStatEntry {
  char: string
  wordCount: number
  stroke: { successCount: number; errorCount: number }
  pinyin: { successCount: number; errorCount: number }
  lastPracticedAt: string | null
  practiced: boolean
}

export interface PracticedItem {
  item: ChineseItem
  group: ChineseGroup
  stat: StatEntry
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

export function calcStats(groups: ChineseGroup[]): ChineseDatasetStats {
  return {
    groups: groups.length,
    words: groups.reduce((sum, g) => sum + g.items.length, 0),
    chars: uniqueChars(groups).size,
  }
}

// --- Practice counts ---

export function countPracticed(groups: ChineseGroup[], statsMap: StatsMap): number {
  let count = 0
  for (const g of groups) {
    for (const item of g.items) {
      if (statsMap.has(`${g.group}::${item.id}`)) count++
    }
  }
  return count
}

export function buildPracticedItems(groups: ChineseGroup[], statsMap: StatsMap): PracticedItem[] {
  const items: PracticedItem[] = []
  for (const g of groups) {
    for (const item of g.items) {
      const stat = statsMap.get(`${g.group}::${item.id}`)
      if (stat) items.push({ item, group: g, stat })
    }
  }
  items.sort((a, b) => (b.stat.lastPracticedAt ?? '').localeCompare(a.stat.lastPracticedAt ?? ''))
  return items
}

// --- Char-level stats ---

export function buildPracticedCharsData(
  groups: ChineseGroup[],
  strokeStats: StatsMap,
  pinyinStats: StatsMap,
): CharStatEntry[] {
  const addStat = (obj: { successCount: number; errorCount: number }, stat: StatEntry | undefined) => {
    if (!stat) return
    obj.successCount += stat.successCount ?? 0
    obj.errorCount += stat.errorCount ?? 0
  }
  const emptyStat = () => ({ successCount: 0, errorCount: 0 })
  const charMap = new Map<string, CharStatEntry>()

  for (const g of groups) {
    for (const item of g.items) {
      const key = `${g.group}::${item.id}`
      const sStat = strokeStats.get(key)
      const pStat = pinyinStats.get(key)
      const hasStat = sStat || pStat
      for (const char of item.word) {
        if (!isCJK(char)) continue
        const existing = charMap.get(char)
        if (existing) {
          existing.wordCount++
          if (hasStat) {
            existing.practiced = true
            addStat(existing.stroke, sStat)
            addStat(existing.pinyin, pStat)
            const lp = (sStat?.lastPracticedAt ?? '') > (pStat?.lastPracticedAt ?? '') ? sStat?.lastPracticedAt : pStat?.lastPracticedAt
            if (lp && (!existing.lastPracticedAt || lp > existing.lastPracticedAt)) {
              existing.lastPracticedAt = lp
            }
          }
        } else {
          const stroke = emptyStat()
          const pinyin = emptyStat()
          addStat(stroke, sStat)
          addStat(pinyin, pStat)
          const lp = (sStat?.lastPracticedAt ?? '') > (pStat?.lastPracticedAt ?? '') ? sStat?.lastPracticedAt : pStat?.lastPracticedAt
          charMap.set(char, {
            char,
            wordCount: 1,
            stroke,
            pinyin,
            lastPracticedAt: lp ?? null,
            practiced: !!hasStat,
          })
        }
      }
    }
  }

  const chars = Array.from(charMap.values())
  chars.sort((a, b) => (b.lastPracticedAt ?? '').localeCompare(a.lastPracticedAt ?? ''))
  return chars
}

// --- Progress / Mastery ---

export function calcProgress(groups: ChineseGroup[], statsMap: StatsMap): number {
  const total = groups.reduce((sum, g) => sum + g.items.length, 0)
  if (total === 0) return 0
  return Math.round((countPracticed(groups, statsMap) / total) * 100)
}

export function calcMastery(groups: ChineseGroup[], statsMap: StatsMap): number {
  const total = groups.reduce((sum, g) => sum + g.items.length, 0)
  if (total === 0) return 0
  let sum = 0
  for (const g of groups) {
    for (const item of g.items) {
      const stat = statsMap.get(`${g.group}::${item.id}`)
      sum += Math.min((stat?.successCount ?? 0) / 10, 1)
    }
  }
  return Math.round((sum / total) * 100)
}

export function calcGroupProgress(group: ChineseGroup, statsMap: StatsMap): number {
  const practiced = group.items.filter(item =>
    statsMap.has(`${group.group}::${item.id}`)
  ).length
  return group.items.length > 0 ? Math.round((practiced / group.items.length) * 100) : 0
}

export function calcGroupMastery(group: ChineseGroup, sessionsMap: SessionsMap): number {
  const fullSessions = sessionsMap.get(group.group)?.full ?? 0
  return Math.min(Math.round((fullSessions / 10) * 100), 100)
}

// --- Sorting ---

export function sortGroupsByLastPracticed(groups: ChineseGroup[], sessionsMap: SessionsMap): ChineseGroup[] {
  return [...groups].sort((a, b) => {
    const tA = sessionsMap.get(a.group)?.lastPracticedAt ?? ''
    const tB = sessionsMap.get(b.group)?.lastPracticedAt ?? ''
    return tB.localeCompare(tA)
  })
}

// --- Chart ---

export function buildChartData(practicedItems: PracticedItem[], dayCounts: DailyActivityMap): ChartData | null {
  if (practicedItems.length === 0) return null
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
    for (const { stat } of practicedItems) {
      if (stat.lastPracticedAt && toLocalDateKey(new Date(stat.lastPracticedAt)) <= bar.date) cum++
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
