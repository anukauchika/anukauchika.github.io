import { statsRepo } from '@app/data/kind/chinese/idb-stats-repo'
import type { PracticeType } from '@app/api/data/kind/chinese/types'
import type { StatsService } from '@app/api/services/kind/chinese/stats-service'
import type { DailyActivity, GroupSessionSummary, WordStat } from '@app/api/services/kind/chinese/types'

const MAX_SESSION_MS = 2 * 60 * 60 * 1000 // 2h safety cap

function toLocalDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function getWordStats(datasetId: string, practiceType: PracticeType): Promise<WordStat[]> {
  const sessions = await statsRepo.getGroupSessions(datasetId, practiceType)

  // Load word attempts per session
  const allWords = []
  for (const s of sessions) {
    const words = await statsRepo.getWordAttempts(s.id)
    for (const w of words) allWords.push({ ...w, groupId: String(s.group_id) })
  }

  // Load char logs for error counts
  const errorsByAttempt = new Map<number, number>()
  for (const w of allWords) {
    const chars = await statsRepo.getCharLogs(w.id)
    let total = 0
    for (const c of chars) total += c.error_count || 0
    errorsByAttempt.set(w.id, total)
  }

  // Aggregate: per (group_id, word_id)
  const stats = new Map<string, WordStat>()
  for (const w of allWords) {
    const key = `${w.groupId}::${w.word_id}`
    const existing = stats.get(key) || {
      datasetId,
      practiceType,
      groupId: w.groupId,
      wordId: String(w.word_id),
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
  return [...stats.values()]
}

async function getGroupSessionSummaries(
  datasetId: string,
  practiceType: PracticeType,
): Promise<Map<string, GroupSessionSummary>> {
  const sessions = await statsRepo.getGroupSessions(datasetId, practiceType)
  const map = new Map<string, GroupSessionSummary>()
  for (const s of sessions) {
    const gid = String(s.group_id)
    const existing = map.get(gid)
    const isFull = s.done_at != null
    const ts = s.done_at || s.started_at
    if (existing) {
      existing.total += 1
      if (isFull) {
        existing.full += 1
        if (!existing.lastFullSessionAt || s.done_at! > existing.lastFullSessionAt) {
          existing.lastFullSessionAt = s.done_at
        }
      }
      if (ts > existing.lastPracticedAt!) {
        existing.lastPracticedAt = ts
      }
    } else {
      map.set(gid, {
        total: 1,
        full: isFull ? 1 : 0,
        lastPracticedAt: ts,
        lastFullSessionAt: isFull ? s.done_at : null,
      })
    }
  }
  return map
}

async function getDailyActivity(datasetId: string, practiceType: PracticeType): Promise<Map<string, DailyActivity>> {
  const sessions = await statsRepo.getGroupSessions(datasetId, practiceType)
  const dayMap = new Map<string, DailyActivity>()
  const dayWords = new Map<string, Set<string>>()

  for (const s of sessions) {
    // Accumulate session duration
    if (s.done_at) {
      const dateKey = toLocalDateKey(new Date(s.done_at))
      const entry = dayMap.get(dateKey) || { count: 0, durationMs: 0, sessions: 0 }
      const dur = Math.min(new Date(s.done_at).getTime() - new Date(s.started_at).getTime(), MAX_SESSION_MS)
      entry.durationMs += Math.max(dur, 0)
      entry.sessions += 1
      dayMap.set(dateKey, entry)
    }
    // Collect unique words per day
    const words = await statsRepo.getWordAttempts(s.id)
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
    dayMap.get(dateKey)!.count = set.size
  }
  return dayMap
}

export const statsService: StatsService = {
  getWordStats,
  getGroupSessionSummaries,
  getDailyActivity,
}
