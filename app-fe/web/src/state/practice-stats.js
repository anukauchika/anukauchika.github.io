import { writable, get } from 'svelte/store'
import * as idb from '../data/idb-stats.js'
import { api } from '../api.js'
import { syncPending, setActiveSessionId } from './sync.js'
import { user } from './auth.js'
import { getDatasetCode } from './registry.js'

// Code conversion: callers use full IDs ('chinese-hskv3-elementary', 'stroke'),
// IDB/Supabase use compact codes ('aa', 's')
const PT_CODES = { stroke: 's' }
function dsCode(id) { return getDatasetCode(id) || id }
function ptCode(type) { return PT_CODES[type] || type }

// --- Stores (shapes unchanged for UI compatibility) ---

/** @type {import('svelte/store').Writable<Map<number, {datasetId,practiceType,groupId,wordId,successCount,lastPracticedAt}>>} */
export const groupStats = writable(new Map())

/** @type {import('svelte/store').Writable<Map<string, {datasetId,practiceType,groupId,wordId,successCount,lastPracticedAt}>>} */
export const datasetStats = writable(new Map())

/**
 * Per-group session summaries: Map<groupId, { total, full, lastPracticedAt, lastFullSessionAt }>
 * "full" = sessions where done_at is set (completed without skip)
 */
export const datasetGroupSessions = writable(new Map())

/**
 * Daily word practice counts: Map<dateString, count>
 * Used for activity line visualization
 */
export const dailyActivity = writable(new Map())

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

export async function loadDailyActivity(datasetId, practiceType) {
  try {
    const sessions = await idb.getGroupSessions(dsCode(datasetId), ptCode(practiceType))
    const dayMap = new Map()
    for (const s of sessions) {
      const words = await idb.getWordAttempts(s.id)
      for (const w of words) {
        if (w.done_at) {
          const dateKey = toLocalDateKey(new Date(w.done_at))
          dayMap.set(dateKey, (dayMap.get(dateKey) || 0) + 1)
        }
      }
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

  // Update datasetGroupSessions store
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

  // Update datasetStats store
  datasetStats.update((map) => {
    const next = new Map(map)
    const key = `${groupId}::${wordId}`
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

  // Update dailyActivity store
  const dateKey = toLocalDateKey(new Date(doneAt))
  dailyActivity.update((map) => {
    const next = new Map(map)
    next.set(dateKey, (next.get(dateKey) || 0) + 1)
    return next
  })
}

