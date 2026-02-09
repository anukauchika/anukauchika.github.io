// @ts-nocheck — dev-only seed utility, will be typed when migrated to TS
/**
 * Generates realistic practice stats for the chinese-hskv3-elementary dataset.
 * Seeds IDB directly via bulk insert — no server sync.
 *
 * Day-driven: picks 1-3 sessions per active day, 15-45 word attempts.
 * Gradually unlocks groups over 2 months, revisits earlier groups.
 * ~60% of days are active, some rest days.
 *
 * Usage (browser console):
 *   import('/src/data/seed-elementary-stats.js').then(m => m.seed())
 */
import * as idb from './idb-stats-repo'

const DATASET_CODE = 'aa'   // chinese-hskv3-elementary
const PRACTICE_TYPE = 's'   // stroke
const WORDS = Array.from({ length: 15 }, (_, i) => i + 1)

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function isoAt(date) {
  return date.toISOString()
}

function pick(arr) {
  return arr[rand(0, arr.length - 1)]
}

export async function seed() {
  const now = new Date('2026-02-06T12:00:00')
  const start = new Date('2025-12-06T08:00:00')
  const totalDays = 62 // Dec 6 - Feb 6

  let sessionId = 800000
  let wordId = 800000
  const sessions = []
  const words = []
  const chars = []

  // Track which groups are "unlocked" — learner progresses ~1 new group every 1-2 days
  let unlockedUpTo = 1

  for (let day = 0; day < totalDays; day++) {
    const dayDate = new Date(start)
    dayDate.setDate(dayDate.getDate() + day)
    dayDate.setHours(0, 0, 0, 0)

    if (dayDate > now) break

    // ~60% of days are active
    if (Math.random() > 0.6) continue

    // Unlock new groups gradually
    if (Math.random() < 0.55 && unlockedUpTo < 55) {
      unlockedUpTo++
    }

    // 1-3 sessions per active day
    const sessionsToday = rand(1, 3)

    for (let s = 0; s < sessionsToday; s++) {
      // Pick a group: bias toward recent unlocks + spaced review of earlier ones
      let group
      if (Math.random() < 0.4 && unlockedUpTo > 3) {
        // Review an older group
        group = rand(1, Math.max(1, unlockedUpTo - 3))
      } else {
        // Practice recent groups
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
      })

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
        })

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
          })
        }

        wordTime = new Date(wordTime.getTime() + wDuration + 1500)
      }
    }
  }

  await idb.bulkInsertSessions(sessions)
  await idb.bulkInsertWordAttempts(words)
  await idb.bulkInsertCharLogs(chars)

  console.log(`Seeded: ${sessions.length} sessions, ${words.length} word attempts, ${chars.length} char logs`)
  console.log('Reload the page and select "HSK V3 2026 Elementary" dataset to see the data.')
}
