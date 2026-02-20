import type { GroupId, WordId } from '@dom/dataset'
import { mkWordKey } from '@dom/dataset'
import type { WordProgress } from '@dom/stats'
import type { DrillId, WordAttempt } from '@dom/drill'
import type { CharAttempt } from '@dom/kind/chinese/drill'
import type { StorageDrill, StorageAttempt, StorageCharLog } from '@dat/kind/chinese/types'
import { lowStatsIdb } from '@low/kind/chinese/idb-stats-repo'
import { lowStatsSupabase } from '@low/supabase/kind/chinese/stats.js'

// --- Internal types ---

interface AttemptMeta {
  groupId: GroupId
  drillCode: string
  errorCount: number
}

// --- DrillRepo ---

export interface DrillRepo {
  getGroupWordsProgress(datasetCode: string, drillCode: string, groupId: GroupId): Promise<Map<WordId, WordProgress>>
  startDrill(userId: string | null, datasetCode: string, drillCode: string, groupId: GroupId): Promise<DrillId>
  endDrill(drillId: DrillId): Promise<StorageDrill | null>
  recordAttempt(drillId: DrillId, attempt: WordAttempt, chars: CharAttempt[]): Promise<AttemptMeta>
}

async function getGroupWordsProgress(datasetCode: string, drillCode: string, groupId: GroupId): Promise<Map<WordId, WordProgress>> {
  const sessions = await lowStatsIdb.getGroupSessions(datasetCode, drillCode)
  const map = new Map<WordId, WordProgress>()

  for (const s of sessions) {
    if (s.group_id !== groupId) continue
    const words = await lowStatsIdb.getWordAttempts(s.id)
    for (const w of words) {
      const chars = await lowStatsIdb.getCharLogs(w.id)
      let errors = 0
      let hints = 0
      for (const c of chars) { errors += c.error_count || 0; hints += c.hint_count || 0 }

      const existing = map.get(w.word_id)
      if (existing) {
        existing.successCount += 1
        existing.errorCount += errors
        existing.hintCount += hints
        if (w.done_at && (!existing.lastDrilledAt || w.done_at > existing.lastDrilledAt)) {
          existing.lastDrilledAt = w.done_at
        }
      } else {
        map.set(w.word_id, { successCount: 1, errorCount: errors, hintCount: hints, lastDrilledAt: w.done_at || null })
      }
    }
  }
  return map
}

async function startDrill(userId: string | null, datasetCode: string, drillCode: string, groupId: GroupId): Promise<DrillId> {
  const now = new Date().toISOString()

  let id: number
  let synced: number
  try {
    const result = await lowStatsSupabase.createGroupSession({
      user_id: userId,
      dataset_id: datasetCode,
      practice_type: drillCode,
      group_id: groupId,
      started_at: now,
    })
    id = result.id
    synced = 1
  } catch {
    id = await lowStatsIdb.nextTempId()
    synced = 0
  }

  await lowStatsIdb.saveGroupSession({
    id,
    user_id: userId,
    dataset_id: datasetCode,
    practice_type: drillCode,
    group_id: groupId,
    started_at: now,
    done_at: null,
    synced,
  })

  return id
}

async function endDrill(drillId: DrillId): Promise<StorageDrill | null> {
  const session = await lowStatsIdb.getGroupSessionById(drillId)
  if (!session) return null

  const now = new Date().toISOString()
  const updated = { ...session, done_at: now, synced: 0 }
  await lowStatsIdb.saveGroupSession(updated)
  return updated
}

async function recordAttempt(drillId: DrillId, attempt: WordAttempt, chars: CharAttempt[]): Promise<AttemptMeta> {
  const session = await lowStatsIdb.getGroupSessionById(drillId)
  if (!session) {
    console.error('recordAttempt: session not found', drillId)
    return { groupId: 0, drillCode: '', errorCount: 0 }
  }

  const wordTempId = await lowStatsIdb.nextTempId()

  await lowStatsIdb.saveWordAttempt({
    id: wordTempId,
    group_session_id: drillId,
    word_id: attempt.wordId,
    started_at: attempt.startedAt,
    done_at: attempt.doneAt,
    synced: 0,
  })

  if (chars.length > 0) {
    await lowStatsIdb.saveCharLogs(
      chars.map((c) => ({
        word_attempt_id: wordTempId,
        char_index: c.charIndex,
        started_at: c.startedAt,
        done_at: c.doneAt,
        error_count: c.errorCount,
        hint_count: c.hintCount,
        synced: 0,
      })),
    )
  }

  const errorCount = chars.reduce((sum, c) => sum + (c.errorCount || 0), 0)
  return { groupId: session.group_id, drillCode: session.practice_type, errorCount }
}

export const datDrill: DrillRepo = {
  getGroupWordsProgress,
  startDrill,
  endDrill,
  recordAttempt,
}

// --- DrillSyncRepo ---

export interface DrillSyncRepo {
  getPendingDrills(): Promise<StorageDrill[]>
  getPendingAttempts(): Promise<StorageAttempt[]>
  getPendingCharLogs(): Promise<StorageCharLog[]>
  syncDrill(tempId: DrillId, realId: DrillId): Promise<void>
  syncAttempt(tempId: number, realId: number): Promise<void>
  pushDrillToRemote(drill: StorageDrill): Promise<{ id: DrillId }>
  pushDrillDoneToRemote(id: DrillId, doneAt: string): Promise<void>
  pushAttemptToRemote(attempt: StorageAttempt): Promise<{ id: number }>
  pushCharLogsToRemote(chars: StorageCharLog[]): Promise<void>
  restoreFromServer(): Promise<void>
  switchDatabase(userId: string | null): Promise<void>
  deleteOldSyncedRecords(cutoffDate: string): Promise<void>
}

export const datDrillSync: DrillSyncRepo = {
  getPendingDrills: () => lowStatsIdb.getPendingGroupSessions(),
  getPendingAttempts: () => lowStatsIdb.getPendingWordAttempts(),
  getPendingCharLogs: () => lowStatsIdb.getPendingCharLogs(),
  syncDrill: (tempId, realId) => lowStatsIdb.markGroupSessionSynced(tempId, realId),
  syncAttempt: (tempId, realId) => lowStatsIdb.markWordAttemptSynced(tempId, realId),

  async pushDrillToRemote(drill) {
    return lowStatsSupabase.createGroupSession({
      user_id: drill.user_id,
      dataset_id: drill.dataset_id,
      practice_type: drill.practice_type,
      group_id: drill.group_id,
      started_at: drill.started_at,
      done_at: drill.done_at,
    })
  },

  pushDrillDoneToRemote: (id, doneAt) => lowStatsSupabase.updateGroupSessionDone(id, doneAt),

  async pushAttemptToRemote(attempt) {
    return lowStatsSupabase.insertWordAttempt({
      group_session_id: attempt.group_session_id,
      word_id: attempt.word_id,
      started_at: attempt.started_at,
      done_at: attempt.done_at,
    })
  },

  async pushCharLogsToRemote(chars) {
    await lowStatsSupabase.insertCharLogs(
      chars.map((c) => ({
        word_attempt_id: c.word_attempt_id,
        char_index: c.char_index,
        started_at: c.started_at,
        done_at: c.done_at,
        error_count: c.error_count,
        hint_count: c.hint_count,
      })),
    )
  },

  async restoreFromServer() {
    const sessions = await lowStatsSupabase.fetchAllUserSessions()
    if (sessions.length === 0) return

    await lowStatsIdb.bulkInsertGroupSessions(sessions.map((s) => ({ ...s, synced: 1 })))

    const sessionIds = sessions.map((s) => s.id)
    const words = await lowStatsSupabase.fetchWordAttempts(sessionIds)
    await lowStatsIdb.bulkInsertWordAttempts(words.map((w) => ({ ...w, synced: 1 })))

    const wordIds = words.map((w) => w.id)
    const chars = await lowStatsSupabase.fetchCharLogs(wordIds)
    await lowStatsIdb.bulkInsertCharLogs(chars.map((c) => ({ ...c, synced: 1 })))
  },

  switchDatabase: (userId) => lowStatsIdb.switchDatabase(userId),
  deleteOldSyncedRecords: (cutoffDate) => lowStatsIdb.deleteOldSyncedRecords(cutoffDate),
}
