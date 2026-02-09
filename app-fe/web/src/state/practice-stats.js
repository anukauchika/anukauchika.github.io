import { writable, get } from 'svelte/store'
import * as idb from '../data/idb-stats-repo'
import { api } from '../supabase.js'
import { syncPending, setActiveSessionId } from './sync.js'
import { user } from './auth.js'
import { getDatasetCode } from './registry.js'

// Code conversion: callers use full IDs ('chinese-hskv3-elementary', 'stroke'),
// IDB/Supabase use compact codes ('aa', 's')
const PT_CODES = { stroke: 's', pinyin: 'p' }
function dsCode(id) { return getDatasetCode(id) || id }
function ptCode(type) { return PT_CODES[type] || type }

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

// --- Helpers ---

function toLocalDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

let nextTempId = -1
const tempIdReady = idb.getMinId().then((min) => { nextTempId = min - 1 })

// --- Load functions ---

export async function loadGroupStats(datasetId, practiceType, groupId) {
  const stats = await idb.getWordStats(dsCode(datasetId), ptCode(practiceType))
  const map = new Map()
  for (const s of stats) {
    if (s.groupId === groupId) map.set(s.wordId, s)
  }
  groupStats.set(map)
}

export async function loadDatasetStats(datasetId, practiceType) {
  const stats = await idb.getWordStats(dsCode(datasetId), ptCode(practiceType))
  const map = new Map()
  for (const s of stats) {
    map.set(`${s.groupId}::${s.wordId}`, s)
  }
  datasetStats.set(map)
}

export async function loadDatasetGroupSessions(datasetId, practiceType) {
  const sessions = await idb.getGroupSessions(dsCode(datasetId), ptCode(practiceType))
  const map = new Map()
  for (const s of sessions) {
    const existing = map.get(s.group_id)
    const isFull = s.done_at != null
    const ts = s.done_at || s.started_at
    if (existing) {
      existing.total += 1
      if (isFull) {
        existing.full += 1
        if (!existing.lastFullSessionAt || s.done_at > existing.lastFullSessionAt) {
          existing.lastFullSessionAt = s.done_at
        }
      }
      if (ts > existing.lastPracticedAt) {
        existing.lastPracticedAt = ts
      }
    } else {
      map.set(s.group_id, {
        total: 1,
        full: isFull ? 1 : 0,
        lastPracticedAt: ts,
        lastFullSessionAt: isFull ? s.done_at : null,
      })
    }
  }
  datasetGroupSessions.set(map)
}

const MAX_SESSION_MS = 2 * 60 * 60 * 1000 // 2h safety cap

export async function loadDailyActivity(datasetId, practiceType) {
  try {
    const sessions = await idb.getGroupSessions(dsCode(datasetId), ptCode(practiceType))
    const dayMap = new Map()
    const dayWords = new Map() // dateKey -> Set of "groupId::wordId"
    for (const s of sessions) {
      // Accumulate session duration
      if (s.done_at) {
        const dateKey = toLocalDateKey(new Date(s.done_at))
        const entry = dayMap.get(dateKey) || { count: 0, durationMs: 0, sessions: 0 }
        const dur = Math.min(new Date(s.done_at) - new Date(s.started_at), MAX_SESSION_MS)
        entry.durationMs += Math.max(dur, 0)
        entry.sessions += 1
        dayMap.set(dateKey, entry)
      }
      // Collect unique words per day
      const words = await idb.getWordAttempts(s.id)
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
      dayMap.get(dateKey).count = set.size
    }
    dailyActivity.set(dayMap)
  } catch (err) {
    console.error('Failed to load daily activity:', err)
  }
}

// --- Aggregated loaders (all practice types) ---

const ALL_PT = Object.keys(PT_CODES)

export async function loadDatasetStatsAll(datasetId) {
  const merged = new Map()
  const perType = { s: new Map(), p: new Map() }
  for (const pt of ALL_PT) {
    const code = ptCode(pt)
    const ptMap = perType[code]
    const stats = await idb.getWordStats(dsCode(datasetId), code)
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
    const sessions = await idb.getGroupSessions(dsCode(datasetId), code)
    for (const s of sessions) {
      const isFull = s.done_at != null
      const ts = s.done_at || s.started_at
      // Per-type map
      const ptExisting = ptMap.get(s.group_id)
      if (ptExisting) {
        ptExisting.total += 1
        if (isFull) {
          ptExisting.full += 1
          if (!ptExisting.lastFullSessionAt || s.done_at > ptExisting.lastFullSessionAt) {
            ptExisting.lastFullSessionAt = s.done_at
          }
        }
        if (ts > ptExisting.lastPracticedAt) {
          ptExisting.lastPracticedAt = ts
        }
      } else {
        ptMap.set(s.group_id, {
          total: 1,
          full: isFull ? 1 : 0,
          lastPracticedAt: ts,
          lastFullSessionAt: isFull ? s.done_at : null,
        })
      }
      // Merged map
      const existing = merged.get(s.group_id)
      if (existing) {
        existing.total += 1
        if (isFull) {
          existing.full += 1
          if (!existing.lastFullSessionAt || s.done_at > existing.lastFullSessionAt) {
            existing.lastFullSessionAt = s.done_at
          }
        }
        if (ts > existing.lastPracticedAt) {
          existing.lastPracticedAt = ts
        }
      } else {
        merged.set(s.group_id, {
          total: 1,
          full: isFull ? 1 : 0,
          lastPracticedAt: ts,
          lastFullSessionAt: isFull ? s.done_at : null,
        })
      }
    }
  }
  datasetGroupSessions.set(merged)
  datasetGroupSessionsStroke.set(perType.s)
  datasetGroupSessionsPinyin.set(perType.p)
}

export async function loadDailyActivityAll(datasetId) {
  try {
    const dayMap = new Map()
    const dayWords = new Map() // dateKey -> Set of "groupId::wordId"
    for (const pt of ALL_PT) {
      const sessions = await idb.getGroupSessions(dsCode(datasetId), ptCode(pt))
      for (const s of sessions) {
        // Accumulate session duration
        if (s.done_at) {
          const dateKey = toLocalDateKey(new Date(s.done_at))
          const entry = dayMap.get(dateKey) || { count: 0, durationMs: 0, sessions: 0 }
          const dur = Math.min(new Date(s.done_at) - new Date(s.started_at), MAX_SESSION_MS)
          entry.durationMs += Math.max(dur, 0)
          entry.sessions += 1
          dayMap.set(dateKey, entry)
        }
        // Collect unique words per day (merged across practice types)
        const words = await idb.getWordAttempts(s.id)
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
    }
    for (const [dateKey, set] of dayWords) {
      dayMap.get(dateKey).count = set.size
    }
    dailyActivity.set(dayMap)
  } catch (err) {
    console.error('Failed to load daily activity:', err)
  }
}

// --- Session lifecycle (new) ---

export async function startGroupSession(datasetId, practiceType, groupId) {
  await tempIdReady

  // Release any previous active session (restart case).
  // It stays in IDB with done_at=null (incomplete) and becomes eligible for sync.
  setActiveSessionId(null)

  const now = new Date().toISOString()
  const u = get(user)
  const userId = u?.id ?? null

  // Online-first: try Supabase to get a real ID for immediate word syncing
  let id
  let synced
  try {
    const result = await api.stats.createGroupSession({
      user_id: userId,
      dataset_id: dsCode(datasetId),
      practice_type: ptCode(practiceType),
      group_id: groupId,
      started_at: now,
    })
    id = result.id
    synced = 1
  } catch {
    // Offline fallback: use temp ID, sync when reconnected
    id = nextTempId--
    synced = 0
  }

  await idb.saveGroupSession({
    id,
    user_id: userId,
    dataset_id: dsCode(datasetId),
    practice_type: ptCode(practiceType),
    group_id: groupId,
    started_at: now,
    done_at: null,
    synced,
  })

  // Protect this session from sync ID remapping while active (offline only)
  setActiveSessionId(id < 0 ? id : null)

  return id
}

export async function endGroupSession(sessionId) {
  const session = await idb.getSessionById(sessionId)
  if (!session) return

  setActiveSessionId(null)

  const now = new Date().toISOString()
  await idb.saveGroupSession({ ...session, done_at: now, synced: 0 })

  syncPending().catch((e) => console.error('sync failed', e))

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
  await tempIdReady
  const session = await idb.getSessionById(sessionId)
  if (!session) {
    console.error('recordWordAttempt: session not found', sessionId)
    return
  }
  const groupId = session.group_id
  const wordTempId = nextTempId--

  await idb.saveWordAttempt({
    id: wordTempId,
    group_session_id: sessionId,
    word_id: wordId,
    started_at: startedAt,
    done_at: doneAt,
    synced: 0,
  })

  if (chars.length > 0) {
    await idb.saveCharLogs(
      chars.map((c) => ({
        word_attempt_id: wordTempId,
        char_index: c.charIndex,
        started_at: c.startedAt,
        done_at: c.doneAt,
        error_count: c.errorCount,
        synced: 0,
      }))
    )
  }

  syncPending().catch((e) => console.error('sync failed', e))

  // Sum error counts from char data
  const attemptErrors = chars.reduce((sum, c) => sum + (c.errorCount || 0), 0)

  // Update groupStats store
  groupStats.update((map) => {
    const next = new Map(map)
    const existing = next.get(wordId)
    const stat = {
      datasetId: null,
      practiceType: null,
      groupId,
      wordId,
      successCount: (existing?.successCount ?? 0) + 1,
      errorCount: (existing?.errorCount ?? 0) + attemptErrors,
      lastPracticedAt: doneAt,
    }
    next.set(wordId, stat)
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
  const ptStore = PT_STATS_STORES[session.practice_type]
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

