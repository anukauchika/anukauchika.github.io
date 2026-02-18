import { writable, get, type Writable } from 'svelte/store'
import { statsService } from '@svc/kind/chinese/stats-service'
import { syncService } from '@svc/sync-service'
import { groupSessionService } from '@svc/kind/chinese/group-session-service'
import { user } from '@stt/auth.js'
import { registryService } from '@svc/registry-service'
import type { PracticeType } from '@dat/kind/chinese/types'
import type { CharAttemptInput, DailyActivity, GroupSessionSummary, StatEntry, StatsMap, SessionsMap, DailyActivityMap } from '@svc/kind/chinese/types'

// Code conversion: callers use full IDs ('chinese-hskv3-elementary', 'stroke'),
// IDB/Supabase use compact codes ('aa', 's')
const PT_CODES: Record<string, PracticeType> = { stroke: 's' as PracticeType, pinyin: 'p' as PracticeType }

function dsCode(id: string): string {
  return registryService.getDatasetCode(id) || id
}

function ptCode(type: string): PracticeType {
  return PT_CODES[type] || type as PracticeType
}

// --- Stores ---

export const groupStats: Writable<Map<number, StatEntry>> = writable(new Map())

/** Merged stats across all practice types */
export const datasetStats: Writable<StatsMap> = writable(new Map())

/** Per-practice-type stats */
export const datasetStatsStroke: Writable<StatsMap> = writable(new Map())
export const datasetStatsPinyin: Writable<StatsMap> = writable(new Map())

/** Merged per-group session summaries */
export const datasetGroupSessions: Writable<SessionsMap> = writable(new Map())

/** Per-practice-type group sessions */
export const datasetGroupSessionsStroke: Writable<SessionsMap> = writable(new Map())
export const datasetGroupSessionsPinyin: Writable<SessionsMap> = writable(new Map())

/** Daily practice stats — used for activity visualization */
export const dailyActivity: Writable<DailyActivityMap> = writable(new Map())

/** Map practice_type code to per-type stores */
const PT_STATS_STORES: Record<string, Writable<StatsMap>> = { s: datasetStatsStroke, p: datasetStatsPinyin }
const PT_SESSION_STORES: Record<string, Writable<SessionsMap>> = { s: datasetGroupSessionsStroke, p: datasetGroupSessionsPinyin }

// --- Load functions ---

export async function loadGroupStats(datasetId: string, practiceType: string, groupId: number): Promise<void> {
  const stats = await statsService.getWordStats(dsCode(datasetId), ptCode(practiceType))
  const map = new Map<number, StatEntry>()
  for (const s of stats) {
    if (s.groupId === groupId) map.set(s.wordId, s)
  }
  groupStats.set(map)
}

export async function loadDatasetGroupSessions(datasetId: string, practiceType: string): Promise<void> {
  const map = await statsService.getGroupSessionSummaries(dsCode(datasetId), ptCode(practiceType))
  datasetGroupSessions.set(map)
}

// --- Aggregated loaders (all practice types) ---

const ALL_PT = Object.keys(PT_CODES)

export async function loadDatasetStatsAll(datasetId: string): Promise<void> {
  const merged = new Map<string, StatEntry>()
  const perType: Record<string, StatsMap> = { s: new Map(), p: new Map() }
  for (const pt of ALL_PT) {
    const code = ptCode(pt)
    const ptMap = perType[code]
    const stats = await statsService.getWordStats(dsCode(datasetId), code)
    for (const s of stats) {
      const key = `${s.groupId}::${s.wordId}`
      ptMap.set(key, { successCount: s.successCount, errorCount: s.errorCount, lastPracticedAt: s.lastPracticedAt })
      const existing = merged.get(key)
      if (existing) {
        existing.successCount += s.successCount ?? 0
        existing.errorCount += s.errorCount ?? 0
        if (s.lastPracticedAt && (!existing.lastPracticedAt || s.lastPracticedAt > existing.lastPracticedAt)) {
          existing.lastPracticedAt = s.lastPracticedAt
        }
      } else {
        merged.set(key, { successCount: s.successCount, errorCount: s.errorCount, lastPracticedAt: s.lastPracticedAt })
      }
    }
  }
  datasetStats.set(merged)
  datasetStatsStroke.set(perType.s)
  datasetStatsPinyin.set(perType.p)
}

export async function loadDatasetGroupSessionsAll(datasetId: string): Promise<void> {
  const merged = new Map<number, GroupSessionSummary>()
  const perType: Record<string, SessionsMap> = { s: new Map(), p: new Map() }
  for (const pt of ALL_PT) {
    const code = ptCode(pt)
    const ptMap = perType[code]
    const map = await statsService.getGroupSessionSummaries(dsCode(datasetId), code)
    for (const [groupId, summary] of map) {
      ptMap.set(groupId, { ...summary })
      const existing = merged.get(groupId)
      if (existing) {
        existing.total += summary.total
        existing.full += summary.full
        if (
          summary.lastFullSessionAt &&
          (!existing.lastFullSessionAt || summary.lastFullSessionAt > existing.lastFullSessionAt)
        ) {
          existing.lastFullSessionAt = summary.lastFullSessionAt
        }
        if (
          summary.lastPracticedAt &&
          (!existing.lastPracticedAt || summary.lastPracticedAt > existing.lastPracticedAt)
        ) {
          existing.lastPracticedAt = summary.lastPracticedAt
        }
      } else {
        merged.set(groupId, { ...summary })
      }
    }
  }
  datasetGroupSessions.set(merged)
  datasetGroupSessionsStroke.set(perType.s)
  datasetGroupSessionsPinyin.set(perType.p)
}

export async function loadDailyActivityAll(datasetId: string): Promise<void> {
  try {
    const merged = new Map<string, DailyActivity>()
    for (const pt of ALL_PT) {
      const map = await statsService.getDailyActivity(dsCode(datasetId), ptCode(pt))
      for (const [dateKey, activity] of map) {
        const existing = merged.get(dateKey)
        if (existing) {
          existing.count += activity.count
          existing.durationMs += activity.durationMs
          existing.sessions += activity.sessions
        } else {
          merged.set(dateKey, { ...activity })
        }
      }
    }
    dailyActivity.set(merged)
  } catch (err) {
    console.error('Failed to load daily activity:', err)
  }
}

// --- Session lifecycle ---

export async function startGroupSession(datasetId: string, practiceType: string, groupId: number): Promise<number> {
  syncService.setActiveSessionId(null)
  const userId = get(user)?.id ?? null
  const id = await groupSessionService.startGroupSession(userId, dsCode(datasetId), ptCode(practiceType), groupId)
  syncService.setActiveSessionId(id < 0 ? id : null)
  return id
}

export async function endGroupSession(sessionId: number): Promise<void> {
  syncService.setActiveSessionId(null)
  const session = await groupSessionService.endGroupSession(sessionId)
  if (!session) return

  syncService.syncPending().catch((e) => console.error('sync failed', e))

  const now = session.done_at

  const updateSessions = (map: SessionsMap): SessionsMap => {
    const next = new Map(map)
    const existing = next.get(session.group_id)
    if (existing) {
      next.set(session.group_id, {
        ...existing,
        full: existing.full + 1,
        lastFullSessionAt: now && now > (existing.lastFullSessionAt ?? '') ? now : existing.lastFullSessionAt,
      })
    }
    return next
  }

  datasetGroupSessions.update(updateSessions)

  const ptStore = PT_SESSION_STORES[session.practice_type]
  if (ptStore) ptStore.update(updateSessions)
}

export async function recordWordAttempt(
  sessionId: number,
  wordId: number,
  startedAt: string,
  doneAt: string,
  chars: CharAttemptInput[],
): Promise<void> {
  const result = await groupSessionService.recordWordAttempt(sessionId, wordId, startedAt, doneAt, chars)

  syncService.syncPending().catch((e) => console.error('sync failed', e))

  const { groupId, errorCount: attemptErrors, practiceType: pt } = result

  // Update groupStats store
  groupStats.update((map) => {
    const next = new Map(map)
    const existing = next.get(wordId)
    next.set(wordId, {
      successCount: (existing?.successCount ?? 0) + 1,
      errorCount: (existing?.errorCount ?? 0) + attemptErrors,
      lastPracticedAt: doneAt,
    })
    return next
  })

  // Update datasetStats + per-type store
  const key = `${groupId}::${wordId}`
  const updateStats = (map: StatsMap): StatsMap => {
    const next = new Map(map)
    const existing = next.get(key)
    next.set(key, {
      successCount: (existing?.successCount ?? 0) + 1,
      errorCount: (existing?.errorCount ?? 0) + attemptErrors,
      lastPracticedAt: doneAt,
    })
    return next
  }

  datasetStats.update(updateStats)

  const ptStore = PT_STATS_STORES[pt]
  if (ptStore) ptStore.update(updateStats)
}
