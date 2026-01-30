import { writable } from 'svelte/store'
import { createIdbStatsRepo } from '../data/idb-stats-repo.js'

// Singleton repo — swap this line to change backend
const repo = createIdbStatsRepo()

/** @type {import('svelte/store').Writable<Map<number, import('../data/stats-repo.js').WordStat>>} */
export const groupStats = writable(new Map())

/** @type {import('svelte/store').Writable<Map<string, import('../data/stats-repo.js').WordStat>>} */
export const datasetStats = writable(new Map())

/**
 * Per-group session summaries: Map<groupId, { total, full, lastPracticedAt, lastFullSessionAt }>
 * "full" = sessions with zero skips
 */
export const datasetGroupSessions = writable(new Map())

/**
 * Daily word practice counts: Map<dateString, count>
 * Used for activity line visualization
 */
export const dailyActivity = writable(new Map())

/**
 * Load daily word practice counts for a dataset.
 */
// Convert Date to YYYY-MM-DD in local timezone
function toLocalDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export async function loadDailyActivity(datasetId, practiceType) {
  try {
    const logs = await repo.getDatasetPracticeLog(datasetId, practiceType)
    const dayMap = new Map()
    for (const log of logs) {
      if (log.practicedAt) {
        // Convert UTC timestamp to local date
        const dateKey = toLocalDateKey(new Date(log.practicedAt))
        dayMap.set(dateKey, (dayMap.get(dateKey) || 0) + 1)
      }
    }
    dailyActivity.set(dayMap)
  } catch (err) {
    console.error('Failed to load daily activity:', err)
  }
}

/**
 * Load aggregate stats for a group into the reactive store.
 */
export async function loadGroupStats(datasetId, practiceType, groupId) {
  const stats = await repo.getGroupStats(datasetId, practiceType, groupId)
  const map = new Map()
  for (const s of stats) {
    map.set(s.wordId, s)
  }
  groupStats.set(map)
}

/**
 * Load aggregate stats for an entire dataset into the reactive store.
 */
export async function loadDatasetStats(datasetId, practiceType) {
  const stats = await repo.getDatasetStats(datasetId, practiceType)
  const map = new Map()
  for (const s of stats) {
    map.set(`${s.groupId}::${s.wordId}`, s)
  }
  datasetStats.set(map)
}

/**
 * Load all group session summaries for a dataset.
 */
export async function loadDatasetGroupSessions(datasetId, practiceType) {
  const sessions = await repo.getDatasetSessions(datasetId, practiceType)
  const map = new Map()
  for (const s of sessions) {
    const existing = map.get(s.groupId)
    const isFull = s.skippedCount === 0
    if (existing) {
      existing.total += 1
      if (isFull) {
        existing.full += 1
        if (!existing.lastFullSessionAt || s.completedAt > existing.lastFullSessionAt) {
          existing.lastFullSessionAt = s.completedAt
        }
      }
      if (s.completedAt > existing.lastPracticedAt) {
        existing.lastPracticedAt = s.completedAt
      }
    } else {
      map.set(s.groupId, {
        total: 1,
        full: isFull ? 1 : 0,
        lastPracticedAt: s.completedAt,
        lastFullSessionAt: isFull ? s.completedAt : null,
      })
    }
  }
  datasetGroupSessions.set(map)
}

/**
 * Record a completed group session and update the reactive store.
 */
export async function recordGroupSession(session) {
  await repo.recordGroupSession(session)
  datasetGroupSessions.update((map) => {
    const next = new Map(map)
    const existing = next.get(session.groupId)
    const isFull = session.skippedCount === 0
    if (existing) {
      next.set(session.groupId, {
        total: existing.total + 1,
        full: existing.full + (isFull ? 1 : 0),
        lastPracticedAt: session.completedAt > existing.lastPracticedAt
          ? session.completedAt : existing.lastPracticedAt,
        lastFullSessionAt: isFull
          ? (session.completedAt > (existing.lastFullSessionAt ?? '') ? session.completedAt : existing.lastFullSessionAt)
          : existing.lastFullSessionAt,
      })
    } else {
      next.set(session.groupId, {
        total: 1,
        full: isFull ? 1 : 0,
        lastPracticedAt: session.completedAt,
        lastFullSessionAt: isFull ? session.completedAt : null,
      })
    }
    return next
  })
}

/**
 * Record a successful practice, persist it, and update the reactive store.
 */
export async function recordSuccess(datasetId, practiceType, groupId, wordId) {
  await repo.recordSuccess(datasetId, practiceType, groupId, wordId)
  const updated = await repo.getStat(datasetId, practiceType, groupId, wordId)
  groupStats.update((map) => {
    const next = new Map(map)
    next.set(wordId, updated)
    return next
  })
  datasetStats.update((map) => {
    const next = new Map(map)
    next.set(`${groupId}::${wordId}`, updated)
    return next
  })
  // Update daily activity
  const today = toLocalDateKey(new Date())
  dailyActivity.update((map) => {
    const next = new Map(map)
    next.set(today, (next.get(today) || 0) + 1)
    return next
  })
}
