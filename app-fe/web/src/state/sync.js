import { api } from '../api.js'
import * as idb from '../data/idb-stats.js'

let syncing = false
let activeSessionId = null

export function setActiveSessionId(id) { activeSessionId = id }

export async function syncPending() {
  if (syncing) return
  syncing = true
  try {
    // 1a. New sessions (temp ID) — skip only the current active session
    const allPendingSessions = await idb.getPendingSessions()
    const newSessions = allPendingSessions.filter((s) => s.id < 0 && s.id !== activeSessionId)
    for (const s of newSessions) {
      const { id: realId } = await api.stats.createGroupSession({
        user_id: s.user_id,
        dataset_id: s.dataset_id,
        practice_type: s.practice_type,
        group_id: s.group_id,
        started_at: s.started_at,
        done_at: s.done_at,
      })
      await idb.markSessionSynced(s.id, realId)
    }

    // 1b. Updated sessions (real ID, need done_at push)
    const updatedSessions = allPendingSessions.filter((s) => s.id > 0)
    for (const s of updatedSessions) {
      await api.stats.updateGroupSessionDone(s.id, s.done_at)
      await idb.saveGroupSession({ ...s, synced: true })
    }

    // 2. Word attempts (positive session ID = session already synced; active session stays negative)
    const allPendingWords = await idb.getPendingWordAttempts()
    const words = allPendingWords.filter((w) => w.group_session_id > 0)
    for (const w of words) {
      const { id: realId } = await api.stats.insertWordAttempt({
        group_session_id: w.group_session_id,
        word_id: w.word_id,
        started_at: w.started_at,
        done_at: w.done_at,
      })
      await idb.markWordAttemptSynced(w.id, realId)
    }

    // 3. Char logs (only those whose word attempt is already synced — positive id)
    const allPendingChars = await idb.getPendingCharLogs()
    const chars = allPendingChars.filter((c) => c.word_attempt_id > 0)
    if (chars.length > 0) {
      await api.stats.insertCharLogs(
        chars.map((c) => ({
          word_attempt_id: c.word_attempt_id,
          char_index: c.char_index,
          started_at: c.started_at,
          done_at: c.done_at,
          error_count: c.error_count,
        }))
      )
      await idb.saveCharLogs(chars.map((c) => ({ ...c, synced: true })))
    }
  } finally {
    syncing = false
  }
}

export async function restoreFromServer() {
  const sessions = await api.stats.fetchAllUserSessions()
  if (sessions.length === 0) return

  await idb.bulkInsertSessions(
    sessions.map((s) => ({ ...s, synced: true }))
  )

  const sessionIds = sessions.map((s) => s.id)
  const words = await api.stats.fetchWordAttempts(sessionIds)
  await idb.bulkInsertWordAttempts(
    words.map((w) => ({ ...w, synced: true }))
  )

  const wordIds = words.map((w) => w.id)
  const chars = await api.stats.fetchCharLogs(wordIds)
  await idb.bulkInsertCharLogs(
    chars.map((c) => ({ ...c, synced: true }))
  )
}
