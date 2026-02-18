/**
 * Generates realistic practice stats for the chinese-hskv3-elementary dataset.
 * Seeds IDB directly via bulk insert — no server sync.
 *
 * Usage (browser console):
 *   import('/src/data/seed-elementary-stats.js').then(m => m.seed())
 */
import { statsRepo } from './idb-stats-repo'
import type { GroupSession, WordAttempt, CharLog } from '@app/api/data/kind/chinese/types'

const DATASET_CODE = 'aa'
const PRACTICE_TYPE = 's'
const WORDS = Array.from({ length: 15 }, (_, i) => i + 1)

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function isoAt(date: Date): string {
  return date.toISOString()
}

export async function seed(): Promise<void> {
  const now = new Date('2026-02-06T12:00:00')
  const start = new Date('2025-12-06T08:00:00')
  const totalDays = 62

  let sessionId = 800000
  let wordId = 800000
  const sessions: GroupSession[] = []
  const words: WordAttempt[] = []
  const chars: CharLog[] = []

  let unlockedUpTo = 1

  for (let day = 0; day < totalDays; day++) {
    const dayDate = new Date(start)
    dayDate.setDate(dayDate.getDate() + day)
    dayDate.setHours(0, 0, 0, 0)

    if (dayDate > now) break

    if (Math.random() > 0.6) continue

    if (Math.random() < 0.55 && unlockedUpTo < 55) {
      unlockedUpTo++
    }

    const sessionsToday = rand(1, 3)

    for (let s = 0; s < sessionsToday; s++) {
      let group: number
      if (Math.random() < 0.4 && unlockedUpTo > 3) {
        group = rand(1, Math.max(1, unlockedUpTo - 3))
      } else {
        group = rand(Math.max(1, unlockedUpTo - 2), unlockedUpTo)
      }

      const hourOffset = rand(8, 21)
      const sessionDate = new Date(dayDate)
      sessionDate.setHours(hourOffset, rand(0, 59), rand(0, 59))

      const sid = sessionId++
      const startedAt = isoAt(sessionDate)

      const isFull = Math.random() < 0.85
      const doneDate = new Date(sessionDate.getTime() + rand(3, 12) * 60000)
      const doneAt = isFull ? isoAt(doneDate) : null

      sessions.push({
        id: sid,
        user_id: null,
        dataset_id: DATASET_CODE,
        practice_type: PRACTICE_TYPE,
        group_id: group,
        started_at: startedAt,
        done_at: doneAt,
        synced: 1,
      } as GroupSession)

      const wordsToAttempt = isFull ? WORDS : WORDS.slice(0, rand(1, WORDS.length - 1))
      let wordTime = new Date(sessionDate.getTime() + 5000)

      for (const wid of wordsToAttempt) {
        const wTempId = wordId++
        const wStarted = isoAt(wordTime)
        const wDuration = rand(3, 15) * 1000
        const wDone = isoAt(new Date(wordTime.getTime() + wDuration))

        words.push({
          id: wTempId,
          group_session_id: sid,
          word_id: wid,
          started_at: wStarted,
          done_at: wDone,
          synced: 1,
        } as WordAttempt)

        const charCount = rand(1, 2)
        const errorChance = group <= 10 ? 0.1 : group <= 25 ? 0.2 : 0.35
        for (let ci = 0; ci < charCount; ci++) {
          const cStarted = new Date(wordTime.getTime() + ci * 2000)
          const errorCount = Math.random() < errorChance ? rand(1, 3) : 0
          chars.push({
            word_attempt_id: wTempId,
            char_index: ci,
            started_at: isoAt(cStarted),
            done_at: isoAt(new Date(cStarted.getTime() + rand(1, 4) * 1000)),
            error_count: errorCount,
            synced: 1,
          } as CharLog)
        }

        wordTime = new Date(wordTime.getTime() + wDuration + 1500)
      }
    }
  }

  await statsRepo.bulkInsertGroupSessions(sessions)
  await statsRepo.bulkInsertWordAttempts(words)
  await statsRepo.bulkInsertCharLogs(chars)

  console.log(`Seeded: ${sessions.length} sessions, ${words.length} word attempts, ${chars.length} char logs`)
  console.log('Reload the page and select "HSK V3 2026 Elementary" dataset to see the data.')
}
