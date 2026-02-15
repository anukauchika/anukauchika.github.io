import { writable, get } from 'svelte/store'
import { statsService } from '../services/stats-service'
import { syncService } from '../services/sync-service'
import { groupSessionService } from '../services/group-session-service'
import { user } from './auth.js'
import { getDatasetCode } from './registry.js'

// Code conversion: callers use full IDs ('chinese-hskv3-elementary', 'stroke'),
// IDB/Supabase use compact codes ('aa', 's')
const PT_CODES = { stroke: 's', pinyin: 'p' }
function dsCode(id) {
  return getDatasetCode(id) || id
}
function ptCode(type) {
  return PT_CODES[type] || type
}

// --- Stores ---

/** @type {import('svelte/store').Writable<Map<number, {datasetId,practiceType,groupId,wordId,successCount,lastPracticedAt}>>} */
export const groupStats = writable(new Map())

/** Merged stats across all practice types — used for chart, calendar, practiced count */
/** @type {import('svelte/store').Writable<Map<string, {datasetId,practiceType,groupId,wordId,successCount,lastPracticedAt}>>} */
export const datasetStats = writable(new Map())

/** Per-practice-type stats — used for separate progress bars and stat displays */
export const datasetStatsStroke = writable(new Map())
export const datasetStatsPinyin = writable(new Map())

/**
 * Merged per-group session summaries: Map<groupId, { total, full, lastPracticedAt, lastFullSessionAt }>
 * "full" = sessions where done_at is set (completed without skip)
 */
export const datasetGroupSessions = writable(new Map())

/** Per-practice-type group sessions */
export const datasetGroupSessionsStroke = writable(new Map())
export const datasetGroupSessionsPinyin = writable(new Map())

/**
 * Daily practice stats: Map<dateString, {count, durationMs, sessions}>
 * Used for activity line visualization
 */
export const dailyActivity = writable(new Map())

/** Map practice_type code to per-type stores */
const PT_STATS_STORES = { s: datasetStatsStroke, p: datasetStatsPinyin }
const PT_SESSION_STORES = { s: datasetGroupSessionsStroke, p: datasetGroupSessionsPinyin }

// --- Load functions ---

export async function loadGroupStats(datasetId, practiceType, groupId) {
  const stats = await statsService.getWordStats(dsCode(datasetId), ptCode(practiceType))
  const map = new Map()
  for (const s of stats) {
    if (s.groupId === groupId) map.set(s.wordId, s)
  }
  groupStats.set(map)
}

export async function loadDatasetGroupSessions(datasetId, practiceType) {
  const map = await statsService.getGroupSessionSummaries(dsCode(datasetId), ptCode(practiceType))
  datasetGroupSessions.set(map)
}

// --- Aggregated loaders (all practice types) ---

const ALL_PT = Object.keys(PT_CODES)

export async function loadDatasetStatsAll(datasetId) {
  const merged = new Map()
  const perType = { s: new Map(), p: new Map() }
  for (const pt of ALL_PT) {
    const code = ptCode(pt)
    const ptMap = perType[code]
    const stats = await statsService.getWordStats(dsCode(datasetId), code)
    for (const s of stats) {
      const key = `${s.groupId}::${s.wordId}`
      // Per-type map
      ptMap.set(key, { ...s })
      // Merged map
      const existing = merged.get(key)
      if (existing) {
        existing.successCount += s.successCount ?? 0
        existing.errorCount += s.errorCount ?? 0
        if (s.lastPracticedAt && (!existing.lastPracticedAt || s.lastPracticedAt > existing.lastPracticedAt)) {
          existing.lastPracticedAt = s.lastPracticedAt
        }
      } else {
        merged.set(key, { ...s })
      }
    }
  }
  datasetStats.set(merged)
  datasetStatsStroke.set(perType.s)
  datasetStatsPinyin.set(perType.p)
}

export async function loadDatasetGroupSessionsAll(datasetId) {
  const merged = new Map()
  const perType = { s: new Map(), p: new Map() }
  for (const pt of ALL_PT) {
    const code = ptCode(pt)
    const ptMap = perType[code]
    const map = await statsService.getGroupSessionSummaries(dsCode(datasetId), code)
    for (const [groupId, summary] of map) {
      ptMap.set(groupId, { ...summary })
      // Merged map
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

export async function loadDailyActivityAll(datasetId) {
  try {
    const merged = new Map()
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

export async function startGroupSession(datasetId, practiceType, groupId) {
  syncService.setActiveSessionId(null)
  const userId = get(user)?.id ?? null
  const id = await groupSessionService.startGroupSession(userId, dsCode(datasetId), ptCode(practiceType), groupId)
  syncService.setActiveSessionId(id < 0 ? id : null)
  return id
}

export async function endGroupSession(sessionId) {
  syncService.setActiveSessionId(null)
  const session = await groupSessionService.endGroupSession(sessionId)
  if (!session) return

  syncService.syncPending().catch((e) => console.error('sync failed', e))

  const now = session.done_at

  // Update datasetGroupSessions store (merged)
  datasetGroupSessions.update((map) => {
    const next = new Map(map)
    const existing = next.get(session.group_id)
    if (existing) {
      next.set(session.group_id, {
        ...existing,
        full: existing.full + 1,
        lastFullSessionAt: now > (existing.lastFullSessionAt ?? '') ? now : existing.lastFullSessionAt,
      })
    }
    return next
  })

  // Update per-type group sessions store
  const ptStore = PT_SESSION_STORES[session.practice_type]
  if (ptStore) {
    ptStore.update((map) => {
      const next = new Map(map)
      const existing = next.get(session.group_id)
      if (existing) {
        next.set(session.group_id, {
          ...existing,
          full: existing.full + 1,
          lastFullSessionAt: now > (existing.lastFullSessionAt ?? '') ? now : existing.lastFullSessionAt,
        })
      }
      return next
    })
  }
}

export async function recordWordAttempt(sessionId, wordId, startedAt, doneAt, chars) {
  const result = await groupSessionService.recordWordAttempt(sessionId, wordId, startedAt, doneAt, chars)

  syncService.syncPending().catch((e) => console.error('sync failed', e))

  const { groupId, errorCount: attemptErrors, practiceType: pt } = result

  // Update groupStats store
  groupStats.update((map) => {
    const next = new Map(map)
    const existing = next.get(wordId)
    next.set(wordId, {
      datasetId: null,
      practiceType: null,
      groupId,
      wordId,
      successCount: (existing?.successCount ?? 0) + 1,
      errorCount: (existing?.errorCount ?? 0) + attemptErrors,
      lastPracticedAt: doneAt,
    })
    return next
  })

  // Update datasetStats store (merged)
  const key = `${groupId}::${wordId}`
  datasetStats.update((map) => {
    const next = new Map(map)
    const existing = next.get(key)
    next.set(key, {
      datasetId: null,
      practiceType: null,
      groupId,
      wordId,
      successCount: (existing?.successCount ?? 0) + 1,
      errorCount: (existing?.errorCount ?? 0) + attemptErrors,
      lastPracticedAt: doneAt,
    })
    return next
  })

  // Update per-type stats store
  const ptStore = PT_STATS_STORES[pt]
  if (ptStore) {
    ptStore.update((map) => {
      const next = new Map(map)
      const existing = next.get(key)
      next.set(key, {
        datasetId: null,
        practiceType: null,
        groupId,
        wordId,
        successCount: (existing?.successCount ?? 0) + 1,
        errorCount: (existing?.errorCount ?? 0) + attemptErrors,
        lastPracticedAt: doneAt,
      })
      return next
    })
  }
}
