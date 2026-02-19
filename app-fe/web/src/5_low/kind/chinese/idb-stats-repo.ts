import { req, tx, createDatabase } from '@low/idb'
import type { StorageDrill, StorageAttempt, StorageCharLog } from '@dat/kind/chinese/types'

const ST_SESSIONS = 'group_sessions'
const ST_WORDS = 'word_attempts'
const ST_CHARS = 'char_logs'

const statsDb = createDatabase('uch-stats', 1, (db) => {
  const sessions = db.createObjectStore(ST_SESSIONS, { keyPath: 'id' })
  sessions.createIndex('dataset_practice', ['dataset_id', 'practice_type'], { unique: false })
  sessions.createIndex('synced', 'synced', { unique: false })

  const words = db.createObjectStore(ST_WORDS, { keyPath: 'id' })
  words.createIndex('group_session_id', 'group_session_id', { unique: false })
  words.createIndex('synced', 'synced', { unique: false })

  const chars = db.createObjectStore(ST_CHARS, { keyPath: ['word_attempt_id', 'char_index'] })
  chars.createIndex('synced', 'synced', { unique: false })
})

// --- Interface methods ---

async function switchDatabase(userId: string | null): Promise<void> {
  await statsDb.switchUser(userId)
}

async function getMinId(): Promise<number> {
  const db = await statsDb.db()
  const t = db.transaction([ST_SESSIONS, ST_WORDS], 'readonly')
  const allSessions = await req(t.objectStore(ST_SESSIONS).getAll())
  const allWords = await req(t.objectStore(ST_WORDS).getAll())
  let min = 0
  for (const s of allSessions) if (s.id < min) min = s.id
  for (const w of allWords) if (w.id < min) min = w.id
  return min
}

async function saveGroupSession(session: StorageDrill): Promise<void> {
  const db = await statsDb.db()
  const t = db.transaction(ST_SESSIONS, 'readwrite')
  t.objectStore(ST_SESSIONS).put(session)
  await tx(t)
}

async function getGroupSessionById(id: number): Promise<StorageDrill | null> {
  const db = await statsDb.db()
  const store = db.transaction(ST_SESSIONS, 'readonly').objectStore(ST_SESSIONS)
  return (await req(store.get(id))) || null
}

async function saveWordAttempt(attempt: StorageAttempt): Promise<void> {
  const db = await statsDb.db()
  const t = db.transaction(ST_WORDS, 'readwrite')
  t.objectStore(ST_WORDS).put(attempt)
  await tx(t)
}

async function saveCharLogs(chars: StorageCharLog[]): Promise<void> {
  const db = await statsDb.db()
  const t = db.transaction(ST_CHARS, 'readwrite')
  const store = t.objectStore(ST_CHARS)
  for (const c of chars) store.put(c)
  await tx(t)
}

async function getGroupSessions(datasetId: string, practiceType: string): Promise<StorageDrill[]> {
  const db = await statsDb.db()
  const store = db.transaction(ST_SESSIONS, 'readonly').objectStore(ST_SESSIONS)
  return req(store.index('dataset_practice').getAll([datasetId, practiceType]))
}

async function getWordAttempts(groupSessionId: number): Promise<StorageAttempt[]> {
  const db = await statsDb.db()
  const store = db.transaction(ST_WORDS, 'readonly').objectStore(ST_WORDS)
  return req(store.index('group_session_id').getAll(groupSessionId))
}

async function getCharLogs(wordAttemptId: number): Promise<StorageCharLog[]> {
  const db = await statsDb.db()
  const store = db.transaction(ST_CHARS, 'readonly').objectStore(ST_CHARS)
  const range = IDBKeyRange.bound([wordAttemptId], [wordAttemptId, Infinity])
  return req(store.getAll(range))
}

async function getPendingGroupSessions(): Promise<StorageDrill[]> {
  const db = await statsDb.db()
  const store = db.transaction(ST_SESSIONS, 'readonly').objectStore(ST_SESSIONS)
  return req(store.index('synced').getAll(0))
}

async function getPendingWordAttempts(): Promise<StorageAttempt[]> {
  const db = await statsDb.db()
  const store = db.transaction(ST_WORDS, 'readonly').objectStore(ST_WORDS)
  return req(store.index('synced').getAll(0))
}

async function getPendingCharLogs(): Promise<StorageCharLog[]> {
  const db = await statsDb.db()
  const store = db.transaction(ST_CHARS, 'readonly').objectStore(ST_CHARS)
  return req(store.index('synced').getAll(0))
}

async function markGroupSessionSynced(tempId: number, realId: number): Promise<void> {
  const db = await statsDb.db()

  const readTx = db.transaction(ST_SESSIONS, 'readonly')
  const session = await req(readTx.objectStore(ST_SESSIONS).get(tempId))
  if (!session) return

  const t = db.transaction([ST_SESSIONS, ST_WORDS], 'readwrite')
  const sessionStore = t.objectStore(ST_SESSIONS)
  const wordStore = t.objectStore(ST_WORDS)

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

async function markWordAttemptSynced(tempId: number, realId: number): Promise<void> {
  const db = await statsDb.db()

  const readTx = db.transaction(ST_WORDS, 'readonly')
  const attempt = await req(readTx.objectStore(ST_WORDS).get(tempId))
  if (!attempt) return

  const t = db.transaction([ST_WORDS, ST_CHARS], 'readwrite')
  const wordStore = t.objectStore(ST_WORDS)
  const charStore = t.objectStore(ST_CHARS)

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

async function bulkInsertGroupSessions(sessions: StorageDrill[]): Promise<void> {
  const db = await statsDb.db()
  const t = db.transaction(ST_SESSIONS, 'readwrite')
  const store = t.objectStore(ST_SESSIONS)
  for (const s of sessions) store.put(s)
  await tx(t)
}

async function bulkInsertWordAttempts(attempts: StorageAttempt[]): Promise<void> {
  const db = await statsDb.db()
  const t = db.transaction(ST_WORDS, 'readwrite')
  const store = t.objectStore(ST_WORDS)
  for (const a of attempts) store.put(a)
  await tx(t)
}

async function bulkInsertCharLogs(chars: StorageCharLog[]): Promise<void> {
  const db = await statsDb.db()
  const t = db.transaction(ST_CHARS, 'readwrite')
  const store = t.objectStore(ST_CHARS)
  for (const c of chars) store.put(c)
  await tx(t)
}

async function isEmpty(): Promise<boolean> {
  const db = await statsDb.db()
  const store = db.transaction(ST_SESSIONS, 'readonly').objectStore(ST_SESSIONS)
  const count = await req(store.count())
  return count === 0
}

async function deleteOldSyncedRecords(cutoffDate: string): Promise<void> {
  const db = await statsDb.db()

  // Find old synced sessions
  const allSessions = await req(
    db.transaction(ST_SESSIONS, 'readonly').objectStore(ST_SESSIONS).index('synced').getAll(1),
  )
  const old = allSessions.filter((s: StorageDrill) => (s.done_at || s.started_at) < cutoffDate)
  if (old.length === 0) return

  const oldSessionIds = new Set(old.map((s: StorageDrill) => s.id))

  // Find word attempts belonging to old sessions
  const allWords = await req(db.transaction(ST_WORDS, 'readonly').objectStore(ST_WORDS).getAll())
  const oldWords = allWords.filter((w: StorageAttempt) => w.synced && oldSessionIds.has(w.group_session_id))

  // Delete in one transaction
  const t = db.transaction([ST_SESSIONS, ST_WORDS, ST_CHARS], 'readwrite')
  const ss = t.objectStore(ST_SESSIONS)
  const ws = t.objectStore(ST_WORDS)
  const cs = t.objectStore(ST_CHARS)

  for (const s of old) ss.delete(s.id)
  for (const w of oldWords) {
    ws.delete(w.id)
    const range = IDBKeyRange.bound([w.id], [w.id, Infinity])
    const chars = await req(cs.getAll(range))
    for (const c of chars) cs.delete([c.word_attempt_id, c.char_index])
  }

  await tx(t)
}

// --- Temp ID counter ---

let nextId: number | null = null

async function nextTempId(): Promise<number> {
  if (nextId === null) {
    const min = await getMinId()
    nextId = min - 1
  }
  return nextId--
}

// --- lowStatsIdb object ---

export interface LowStatsIdb {
  saveGroupSession(session: StorageDrill): Promise<void>
  getGroupSessionById(id: number): Promise<StorageDrill | null>
  getGroupSessions(datasetId: string, practiceType: string): Promise<StorageDrill[]>
  saveWordAttempt(attempt: StorageAttempt): Promise<void>
  getWordAttempts(groupSessionId: number): Promise<StorageAttempt[]>
  saveCharLogs(chars: StorageCharLog[]): Promise<void>
  getCharLogs(wordAttemptId: number): Promise<StorageCharLog[]>
  getPendingGroupSessions(): Promise<StorageDrill[]>
  getPendingWordAttempts(): Promise<StorageAttempt[]>
  getPendingCharLogs(): Promise<StorageCharLog[]>
  markGroupSessionSynced(tempId: number, realId: number): Promise<void>
  markWordAttemptSynced(tempId: number, realId: number): Promise<void>
  bulkInsertGroupSessions(sessions: StorageDrill[]): Promise<void>
  bulkInsertWordAttempts(attempts: StorageAttempt[]): Promise<void>
  bulkInsertCharLogs(chars: StorageCharLog[]): Promise<void>
  isEmpty(): Promise<boolean>
  getMinId(): Promise<number>
  nextTempId(): Promise<number>
  deleteOldSyncedRecords(cutoffDate: string): Promise<void>
  switchDatabase(userId: string | null): Promise<void>
}

export const lowStatsIdb: LowStatsIdb = {
  saveGroupSession,
  getGroupSessionById,
  getGroupSessions,
  saveWordAttempt,
  getWordAttempts,
  saveCharLogs,
  getCharLogs,
  getPendingGroupSessions,
  getPendingWordAttempts,
  getPendingCharLogs,
  markGroupSessionSynced,
  markWordAttemptSynced,
  bulkInsertGroupSessions,
  bulkInsertWordAttempts,
  bulkInsertCharLogs,
  isEmpty,
  getMinId,
  nextTempId,
  deleteOldSyncedRecords,
  switchDatabase,
}
