import type { GroupId, WordKey } from '@dom/dataset'
import { mkWordKey } from '@dom/dataset'
import type { GroupProgress } from '@dom/stats'
import type { ChineseHomeSummary } from '@dom/kind/chinese/stats'
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

export interface LocalHomeStats {
  todaySessions: number
  todayDurationMs: number
  drilledWords: number
}

export interface StatsRepo {
  getGroupProgress(datasetCode: string, drillCode: string): Promise<Map<GroupId, GroupProgress>>
  getGroupReviewProgress(datasetCode: string, groupIds: GroupId[], timeZone: string): Promise<Record<string, Map<GroupId, GroupProgress>>>
  getServerHomeSummary(datasetCode: string, groupIds: GroupId[], timeZone: string): Promise<ChineseHomeSummary | null>
  getLocalHomeStats(datasetCode: string): Promise<LocalHomeStats>
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

async function getGroupReviewProgress(datasetCode: string, groupIds: GroupId[], timeZone: string): Promise<Record<string, Map<GroupId, GroupProgress>>> {
  const perType: Record<string, Map<GroupId, GroupProgress>> = { s: new Map(), p: new Map() }
  const rows = await lowStatsSupabase.getChineseGroupReviewState(datasetCode, groupIds, timeZone)

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
      reviewState: row.reason as GroupProgress['reviewState'],
      dueAt: row.due_at,
      intervalDays: row.interval_days,
    })
  }

  return perType
}

async function getServerHomeSummary(datasetCode: string, groupIds: GroupId[], timeZone: string): Promise<ChineseHomeSummary | null> {
  const row = await lowStatsSupabase.getChineseHomeSummary(datasetCode, groupIds, timeZone)
  if (!row) return null

  return {
    todaySessions: row.today_sessions,
    todayDurationMs: Number(row.today_duration_ms),
    dueCount: row.due_count,
    drilledWords: row.drilled_words,
    next: row.next_group_id != null
      ? { groupId: row.next_group_id, type: row.next_practice_type === 'p' ? 'pinyin' : 'stroke' }
      : null,
  }
}

// Offline fallback for authenticated users when the server RPC fails (anon
// drills are never persisted, so callers skip this entirely for anon).
// "Done" sessions must be clean (no hints) — a session that used hints leaves
// its group in 'repeat' state (still due), so counting it as done would
// double-count the same lesson on both sides of the ratio.
async function getLocalHomeStats(datasetCode: string): Promise<LocalHomeStats> {
  const todayKey = toLocalDateKey(new Date())
  const drilledWords = new Set<WordKey>()
  let todaySessions = 0
  let todayDurationMs = 0

  for (const drillCode of ['s', 'p']) {
    const sessions = await lowStatsIdb.getGroupSessions(datasetCode, drillCode)
    for (const s of sessions) {
      const words = await lowStatsIdb.getWordAttempts(s.id)
      for (const w of words) drilledWords.add(mkWordKey(s.group_id, w.word_id))

      if (!s.done_at || toLocalDateKey(new Date(s.done_at)) !== todayKey) continue

      const dur = Math.min(new Date(s.done_at).getTime() - new Date(s.started_at).getTime(), MAX_SESSION_MS)
      todayDurationMs += Math.max(dur, 0)

      let hintCount = 0
      for (const w of words) {
        const chars = await lowStatsIdb.getCharLogs(w.id)
        for (const c of chars) hintCount += c.hint_count || 0
      }
      if (hintCount === 0) todaySessions += 1
    }
  }

  return { todaySessions, todayDurationMs, drilledWords: drilledWords.size }
}

export const datStats: StatsRepo = {
  getGroupProgress,
  getGroupReviewProgress,
  getServerHomeSummary,
  getLocalHomeStats,
}
