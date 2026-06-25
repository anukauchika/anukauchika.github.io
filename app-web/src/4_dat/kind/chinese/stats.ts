import type { GroupId, WordKey } from '@dom/dataset'
import { mkWordKey } from '@dom/dataset'
import type { DayKey, WordProgress, GroupProgress, DayProgress } from '@dom/stats'
import type { StorageDrill } from '@dat/kind/chinese/types'
import { lowStatsIdb } from '@low/kind/chinese/idb-stats-repo'
import { lowStatsSupabase } from '@low/supabase/kind/chinese/stats.js'

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
  getGroupReviewProgress(datasetCode: string, groupIds: GroupId[]): Promise<Record<string, Map<GroupId, GroupProgress>>>
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

function emptyGroupProgress(): GroupProgress {
  return {
    total: 0,
    full: 0,
    clean: 0,
    firstDrilledAt: null,
    lastDrilledAt: null,
    lastFullDrillAt: null,
    lastCleanDrillAt: null,
    lastSessionHintCount: null,
  }
}

function mergeIntoGroupProgress(target: GroupProgress, add: GroupProgress): void {
  target.total += add.total
  target.full += add.full
  target.clean += add.clean
  if (add.firstDrilledAt && (!target.firstDrilledAt || add.firstDrilledAt < target.firstDrilledAt)) {
    target.firstDrilledAt = add.firstDrilledAt
  }
  if (add.lastDrilledAt && (!target.lastDrilledAt || add.lastDrilledAt > target.lastDrilledAt)) {
    target.lastDrilledAt = add.lastDrilledAt
  }
  if (add.lastCleanDrillAt && (!target.lastCleanDrillAt || add.lastCleanDrillAt > target.lastCleanDrillAt)) {
    target.lastCleanDrillAt = add.lastCleanDrillAt
  }
  if (add.lastFullDrillAt && (!target.lastFullDrillAt || add.lastFullDrillAt > target.lastFullDrillAt)) {
    target.lastFullDrillAt = add.lastFullDrillAt
    target.lastSessionHintCount = add.lastSessionHintCount
  }
}

async function sessionProgress(s: StorageDrill): Promise<GroupProgress> {
  const gp = emptyGroupProgress()
  const ts = s.done_at || s.started_at
  gp.total = 1
  gp.firstDrilledAt = ts
  gp.lastDrilledAt = ts

  if (!s.done_at) return gp

  const words = await lowStatsIdb.getWordAttempts(s.id)
  let hintCount = 0
  for (const w of words) {
    const chars = await lowStatsIdb.getCharLogs(w.id)
    for (const c of chars) hintCount += c.hint_count || 0
  }

  gp.full = 1
  gp.lastFullDrillAt = s.done_at
  gp.lastSessionHintCount = hintCount
  if (hintCount === 0) {
    gp.clean = 1
    gp.lastCleanDrillAt = s.done_at
  }

  return gp
}

async function getGroupProgress(datasetCode: string, drillCode: string): Promise<Map<GroupId, GroupProgress>> {
  const sessions = await lowStatsIdb.getGroupSessions(datasetCode, drillCode)
  const summaries = await lowStatsIdb.getGroupScheduleSummaries(datasetCode, drillCode)
  const map = new Map<GroupId, GroupProgress>()

  for (const s of summaries) {
    const existing = map.get(s.group_id) ?? emptyGroupProgress()
    mergeIntoGroupProgress(existing, {
      total: s.total,
      full: s.full,
      clean: s.clean,
      firstDrilledAt: s.first_drilled_at,
      lastDrilledAt: s.last_drilled_at,
      lastFullDrillAt: s.last_full_drill_at,
      lastCleanDrillAt: s.last_clean_drill_at,
      lastSessionHintCount: s.last_session_hint_count,
    })
    map.set(s.group_id, existing)
  }

  for (const s of sessions) {
    const existing = map.get(s.group_id) ?? emptyGroupProgress()
    mergeIntoGroupProgress(existing, await sessionProgress(s))
    map.set(s.group_id, existing)
  }
  return map
}

async function getGroupReviewProgress(datasetCode: string, groupIds: GroupId[]): Promise<Record<string, Map<GroupId, GroupProgress>>> {
  const perType: Record<string, Map<GroupId, GroupProgress>> = { s: new Map(), p: new Map() }
  const rows = await lowStatsSupabase.getChineseGroupReviewState(datasetCode, groupIds)

  for (const row of rows) {
    if (row.full_count === 0) continue
    const map = perType[row.practice_type]
    if (!map) continue

    map.set(row.group_id, {
      total: row.full_count,
      full: row.full_count,
      clean: row.clean_count,
      firstDrilledAt: row.first_full_at,
      lastDrilledAt: row.last_full_at,
      lastFullDrillAt: row.last_full_at,
      lastCleanDrillAt: row.last_clean_at,
      lastSessionHintCount: row.last_session_hint_count,
    })
  }

  return perType
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
  getGroupReviewProgress,
  getDayProgress,
}
