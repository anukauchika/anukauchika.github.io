import type { GroupId, WordKey } from '@dom/dataset'
import { mkWordKey } from '@dom/dataset'
import type { DayKey, WordProgress, GroupProgress, DayProgress } from '@dom/stats'
import { lowStatsIdb } from '@low/kind/chinese/idb-stats-repo'

const MAX_SESSION_MS = 2 * 60 * 60 * 1000 // 2h safety cap

function toLocalDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export interface StatsRepo {
  getWordProgress(datasetCode: string, drillCode: string): Promise<Map<WordKey, WordProgress>>
  getGroupProgress(datasetCode: string, drillCode: string): Promise<Map<GroupId, GroupProgress>>
  getDayProgress(datasetCode: string, drillCode: string): Promise<Map<DayKey, DayProgress>>
}

async function getWordProgress(datasetCode: string, drillCode: string): Promise<Map<WordKey, WordProgress>> {
  const sessions = await lowStatsIdb.getGroupSessions(datasetCode, drillCode)
  const map = new Map<WordKey, WordProgress>()

  for (const s of sessions) {
    const words = await lowStatsIdb.getWordAttempts(s.id)
    for (const w of words) {
      const key = mkWordKey(s.group_id, w.word_id)
      const chars = await lowStatsIdb.getCharLogs(w.id)
      let errors = 0
      let hints = 0
      for (const c of chars) { errors += c.error_count || 0; hints += c.hint_count || 0 }

      const existing = map.get(key)
      if (existing) {
        existing.successCount += 1
        existing.errorCount += errors
        existing.hintCount += hints
        if (w.done_at && (!existing.lastDrilledAt || w.done_at > existing.lastDrilledAt)) {
          existing.lastDrilledAt = w.done_at
        }
      } else {
        map.set(key, { successCount: 1, errorCount: errors, hintCount: hints, lastDrilledAt: w.done_at || null })
      }
    }
  }
  return map
}

async function getGroupProgress(datasetCode: string, drillCode: string): Promise<Map<GroupId, GroupProgress>> {
  const sessions = await lowStatsIdb.getGroupSessions(datasetCode, drillCode)
  const map = new Map<GroupId, GroupProgress>()

  for (const s of sessions) {
    const isFull = s.done_at != null
    const ts = s.done_at || s.started_at
    const existing = map.get(s.group_id)
    if (existing) {
      existing.total += 1
      if (isFull) {
        existing.full += 1
        if (!existing.lastFullDrillAt || s.done_at! > existing.lastFullDrillAt) {
          existing.lastFullDrillAt = s.done_at
        }
      }
      if (ts > existing.lastDrilledAt!) {
        existing.lastDrilledAt = ts
      }
    } else {
      map.set(s.group_id, {
        total: 1,
        full: isFull ? 1 : 0,
        lastDrilledAt: ts,
        lastFullDrillAt: isFull ? s.done_at : null,
      })
    }
  }
  return map
}

async function getDayProgress(datasetCode: string, drillCode: string): Promise<Map<DayKey, DayProgress>> {
  const sessions = await lowStatsIdb.getGroupSessions(datasetCode, drillCode)
  const dayMap = new Map<DayKey, DayProgress>()
  const dayWords = new Map<DayKey, Set<string>>()

  for (const s of sessions) {
    if (s.done_at) {
      const dateKey = toLocalDateKey(new Date(s.done_at))
      const entry = dayMap.get(dateKey) || { count: 0, durationMs: 0, sessions: 0 }
      const dur = Math.min(new Date(s.done_at).getTime() - new Date(s.started_at).getTime(), MAX_SESSION_MS)
      entry.durationMs += Math.max(dur, 0)
      entry.sessions += 1
      dayMap.set(dateKey, entry)
    }
    const words = await lowStatsIdb.getWordAttempts(s.id)
    for (const w of words) {
      if (w.done_at) {
        const dateKey = toLocalDateKey(new Date(w.done_at))
        if (!dayMap.has(dateKey)) dayMap.set(dateKey, { count: 0, durationMs: 0, sessions: 0 })
        const set = dayWords.get(dateKey) || new Set()
        set.add(`${s.group_id}::${w.word_id}`)
        dayWords.set(dateKey, set)
      }
    }
  }

  for (const [dateKey, set] of dayWords) {
    dayMap.get(dateKey)!.count = set.size
  }
  return dayMap
}

export const datStats: StatsRepo = {
  getWordProgress,
  getGroupProgress,
  getDayProgress,
}
