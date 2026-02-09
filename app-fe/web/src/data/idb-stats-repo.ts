// TODO: Remove after 2026-03-06 — legacy database cleanup
indexedDB.deleteDatabase('memris-stats')
indexedDB.deleteDatabase('memris-stats-v2')

import { req, tx, createDatabase } from './idb'
import type { GroupSession, WordAttempt, CharLog, WordStat } from '../api/types'

const SESSIONS = 'group_sessions'
const WORDS = 'word_attempts'
const CHARS = 'char_logs'

const statsDb = createDatabase('uch-stats', 1, (db) => {
  const sessions = db.createObjectStore(SESSIONS, { keyPath: 'id' })
  sessions.createIndex('dataset_practice', ['dataset_id', 'practice_type'], { unique: false })
  sessions.createIndex('synced', 'synced', { unique: false })

  const words = db.createObjectStore(WORDS, { keyPath: 'id' })
  words.createIndex('group_session_id', 'group_session_id', { unique: false })
  words.createIndex('synced', 'synced', { unique: false })

  const chars = db.createObjectStore(CHARS, { keyPath: ['word_attempt_id', 'char_index'] })
  chars.createIndex('synced', 'synced', { unique: false })
})

export async function switchDatabase(userId: string | null): Promise<void> {
  await statsDb.switchUser(userId)
}

export async function getMinId(): Promise<number> {
  const db = await statsDb.db()
  const t = db.transaction([SESSIONS, WORDS], 'readonly')
  const allSessions = await req(t.objectStore(SESSIONS).getAll())
  const allWords = await req(t.objectStore(WORDS).getAll())
  let min = 0
  for (const s of allSessions) if (s.id < min) min = s.id
  for (const w of allWords) if (w.id < min) min = w.id
  return min
}

// --- Write ---

export async function saveGroupSession(session: GroupSession): Promise<void> {
  const db = await statsDb.db()
  const t = db.transaction(SESSIONS, 'readwrite')
  t.objectStore(SESSIONS).put(session)
  await tx(t)
}

export async function getSessionById(id: number): Promise<GroupSession | null> {
  const db = await statsDb.db()
  const store = db.transaction(SESSIONS, 'readonly').objectStore(SESSIONS)
  return (await req(store.get(id))) || null
}

export async function saveWordAttempt(attempt: WordAttempt): Promise<void> {
  const db = await statsDb.db()
  const t = db.transaction(WORDS, 'readwrite')
  t.objectStore(WORDS).put(attempt)
  await tx(t)
}

export async function saveCharLogs(chars: CharLog[]): Promise<void> {
  const db = await statsDb.db()
  const t = db.transaction(CHARS, 'readwrite')
  const store = t.objectStore(CHARS)
  for (const c of chars) store.put(c)
  await tx(t)
}

// --- Read ---

export async function getGroupSessions(datasetId: string, practiceType: string): Promise<GroupSession[]> {
  const db = await statsDb.db()
  const store = db.transaction(SESSIONS, 'readonly').objectStore(SESSIONS)
  return req(store.index('dataset_practice').getAll([datasetId, practiceType]))
}

export async function getWordAttempts(groupSessionId: number): Promise<WordAttempt[]> {
  const db = await statsDb.db()
  const store = db.transaction(WORDS, 'readonly').objectStore(WORDS)
  return req(store.index('group_session_id').getAll(groupSessionId))
}

export async function getCharLogs(wordAttemptId: number): Promise<CharLog[]> {
  const db = await statsDb.db()
  const store = db.transaction(CHARS, 'readonly').objectStore(CHARS)
  const range = IDBKeyRange.bound([wordAttemptId], [wordAttemptId, Infinity])
  return req(store.getAll(range))
}

export async function getWordStats(datasetId: string, practiceType: string): Promise<WordStat[]> {
  const sessions = await getGroupSessions(datasetId, practiceType)
  const sessionIds = new Set(sessions.map((s) => s.id))

  const db = await statsDb.db()
  const t = db.transaction([WORDS, CHARS], 'readonly')
  const allWords = await req(t.objectStore(WORDS).getAll())
  const words = allWords.filter((w) => sessionIds.has(w.group_session_id))

  // Load char logs for all relevant word attempts to sum error counts
  const charStore = t.objectStore(CHARS)
  const errorsByAttempt = new Map()
  for (const w of words) {
    const range = IDBKeyRange.bound([w.id], [w.id, Infinity])
    const chars = await req(charStore.getAll(range))
    let total = 0
    for (const c of chars) total += c.error_count || 0
    errorsByAttempt.set(w.id, total)
  }

  // Aggregate: per (group_id, word_id) → { successCount, errorCount, lastPracticedAt }
  const stats = new Map()
  for (const s of sessions) {
    const sessionWords = words.filter((w) => w.group_session_id === s.id)
    for (const w of sessionWords) {
      const key = `${s.group_id}::${w.word_id}`
      const existing = stats.get(key) || {
        datasetId,
        practiceType,
        groupId: s.group_id,
        wordId: w.word_id,
        successCount: 0,
        errorCount: 0,
        lastPracticedAt: null,
      }
      existing.successCount += 1
      existing.errorCount += errorsByAttempt.get(w.id) || 0
      if (!existing.lastPracticedAt || w.done_at > existing.lastPracticedAt) {
        existing.lastPracticedAt = w.done_at
      }
      stats.set(key, existing)
    }
  }
  return [...stats.values()]
}

// --- Sync: get pending ---

export async function getPendingSessions(): Promise<GroupSession[]> {
  const db = await statsDb.db()
  const store = db.transaction(SESSIONS, 'readonly').objectStore(SESSIONS)
  return req(store.index('synced').getAll(0))
}

export async function getPendingWordAttempts(): Promise<WordAttempt[]> {
  const db = await statsDb.db()
  const store = db.transaction(WORDS, 'readonly').objectStore(WORDS)
  return req(store.index('synced').getAll(0))
}

export async function getPendingCharLogs(): Promise<CharLog[]> {
  const db = await statsDb.db()
  const store = db.transaction(CHARS, 'readonly').objectStore(CHARS)
  return req(store.index('synced').getAll(0))
}

// --- Sync: mark synced ---

export async function markSessionSynced(tempId: number, realId: number): Promise<void> {
  const db = await statsDb.db()

  // Read session, delete old key, write with real id
  const readTx = db.transaction(SESSIONS, 'readonly')
  const session = await req(readTx.objectStore(SESSIONS).get(tempId))
  if (!session) return

  const t = db.transaction([SESSIONS, WORDS], 'readwrite')
  const sessionStore = t.objectStore(SESSIONS)
  const wordStore = t.objectStore(WORDS)

  sessionStore.delete(tempId)
  sessionStore.put({ ...session, id: realId, synced: 1 })

  // Update word_attempts that reference the temp session id
  const wordIndex = wordStore.index('group_session_id')
  const words = await req(wordIndex.getAll(tempId))
  for (const w of words) {
    wordStore.put({ ...w, group_session_id: realId })
  }

  await tx(t)
}

export async function markWordAttemptSynced(tempId: number, realId: number): Promise<void> {
  const db = await statsDb.db()

  // Read attempt, delete old key, write with real id
  const readTx = db.transaction(WORDS, 'readonly')
  const attempt = await req(readTx.objectStore(WORDS).get(tempId))
  if (!attempt) return

  const t = db.transaction([WORDS, CHARS], 'readwrite')
  const wordStore = t.objectStore(WORDS)
  const charStore = t.objectStore(CHARS)

  wordStore.delete(tempId)
  wordStore.put({ ...attempt, id: realId, synced: 1 })

  // Update char_logs that reference the temp word attempt id
  const range = IDBKeyRange.bound([tempId], [tempId, Infinity])
  const matching = await req(charStore.getAll(range))
  for (const c of matching) {
    charStore.delete([c.word_attempt_id, c.char_index])
    charStore.put({ ...c, word_attempt_id: realId })
  }

  await tx(t)
}

// --- Restore from server ---

export async function bulkInsertSessions(sessions: GroupSession[]): Promise<void> {
  const db = await statsDb.db()
  const t = db.transaction(SESSIONS, 'readwrite')
  const store = t.objectStore(SESSIONS)
  for (const s of sessions) store.put(s)
  await tx(t)
}

export async function bulkInsertWordAttempts(attempts: WordAttempt[]): Promise<void> {
  const db = await statsDb.db()
  const t = db.transaction(WORDS, 'readwrite')
  const store = t.objectStore(WORDS)
  for (const a of attempts) store.put(a)
  await tx(t)
}

export async function bulkInsertCharLogs(chars: CharLog[]): Promise<void> {
  const db = await statsDb.db()
  const t = db.transaction(CHARS, 'readwrite')
  const store = t.objectStore(CHARS)
  for (const c of chars) store.put(c)
  await tx(t)
}

export async function isEmpty(): Promise<boolean> {
  const db = await statsDb.db()
  const store = db.transaction(SESSIONS, 'readonly').objectStore(SESSIONS)
  const count = await req(store.count())
  return count === 0
}

// --- Cleanup: delete synced records older than 90 days ---

const CLEANUP_KEY = 'uch-stats-last-cleanup'
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000
const RETENTION_MS = 90 * 24 * 60 * 60 * 1000

export async function cleanupOldRecords(): Promise<void> {
  const last = localStorage.getItem(CLEANUP_KEY)
  if (last && Date.now() - Number(last) < CLEANUP_INTERVAL_MS) return

  const cutoff = new Date(Date.now() - RETENTION_MS).toISOString()
  const db = await statsDb.db()

  // Find old synced sessions
  const allSessions = await req(db.transaction(SESSIONS, 'readonly').objectStore(SESSIONS).index('synced').getAll(1))
  const old = allSessions.filter((s) => (s.done_at || s.started_at) < cutoff)
  if (old.length === 0) {
    localStorage.setItem(CLEANUP_KEY, String(Date.now()))
    return
  }

  const oldSessionIds = new Set(old.map((s) => s.id))

  // Find word attempts belonging to old sessions
  const allWords = await req(db.transaction(WORDS, 'readonly').objectStore(WORDS).getAll())
  const oldWords = allWords.filter((w) => w.synced && oldSessionIds.has(w.group_session_id))

  // Delete in one transaction
  const t = db.transaction([SESSIONS, WORDS, CHARS], 'readwrite')
  const ss = t.objectStore(SESSIONS)
  const ws = t.objectStore(WORDS)
  const cs = t.objectStore(CHARS)

  for (const s of old) ss.delete(s.id)
  for (const w of oldWords) {
    ws.delete(w.id)
    // Delete char logs for this word attempt
    const range = IDBKeyRange.bound([w.id], [w.id, Infinity])
    const chars = await req(cs.getAll(range))
    for (const c of chars) cs.delete([c.word_attempt_id, c.char_index])
  }

  await tx(t)
  localStorage.setItem(CLEANUP_KEY, String(Date.now()))
}

// Run cleanup on module load (non-blocking)
cleanupOldRecords().catch((e) => console.error('stats cleanup failed', e))
