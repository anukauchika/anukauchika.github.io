import { statsRepo } from '@app/data/kind/chinese/idb-stats-repo'
import { api } from '@app/data/supabase/index.js'
import type { GroupSession, PracticeType } from '@app/api/data/kind/chinese/types'
import type { GroupSessionService } from '@app/api/services/kind/chinese/group-session-service'
import type { CharAttemptInput, WordAttemptResult } from '@app/api/services/kind/chinese/types'

async function startGroupSession(
  userId: string | null,
  datasetId: string,
  practiceType: PracticeType,
  groupId: string,
): Promise<number> {
  const now = new Date().toISOString()

  let id: number
  let synced: number
  try {
    const result = await api.stats.createGroupSession({
      user_id: userId,
      dataset_id: datasetId,
      practice_type: practiceType,
      group_id: groupId,
      started_at: now,
    })
    id = result.id
    synced = 1
  } catch {
    id = await statsRepo.nextTempId()
    synced = 0
  }

  await statsRepo.saveGroupSession({
    id,
    user_id: userId,
    dataset_id: datasetId,
    practice_type: practiceType,
    group_id: groupId,
    started_at: now,
    done_at: null,
    synced,
  })

  return id
}

async function endGroupSession(sessionId: number): Promise<GroupSession | null> {
  const session = await statsRepo.getGroupSessionById(sessionId)
  if (!session) return null

  const now = new Date().toISOString()
  const updated = { ...session, done_at: now, synced: 0 }
  await statsRepo.saveGroupSession(updated)
  return updated
}

async function recordWordAttempt(
  sessionId: number,
  wordId: string,
  startedAt: string,
  doneAt: string,
  chars: CharAttemptInput[],
): Promise<WordAttemptResult> {
  const session = await statsRepo.getGroupSessionById(sessionId)
  if (!session) {
    console.error('recordWordAttempt: session not found', sessionId)
    return { wordId, groupId: '', practiceType: '' as PracticeType, errorCount: 0 }
  }

  const wordTempId = await statsRepo.nextTempId()

  await statsRepo.saveWordAttempt({
    id: wordTempId,
    group_session_id: sessionId,
    word_id: wordId,
    started_at: startedAt,
    done_at: doneAt,
    synced: 0,
  })

  if (chars.length > 0) {
    await statsRepo.saveCharLogs(
      chars.map((c) => ({
        word_attempt_id: wordTempId,
        char_index: c.charIndex,
        started_at: c.startedAt,
        done_at: c.doneAt,
        error_count: c.errorCount,
        synced: 0,
      })),
    )
  }

  const errorCount = chars.reduce((sum, c) => sum + (c.errorCount || 0), 0)
  return { wordId, groupId: session.group_id, practiceType: session.practice_type, errorCount }
}

export const groupSessionService: GroupSessionService = {
  startGroupSession,
  endGroupSession,
  recordWordAttempt,
}
