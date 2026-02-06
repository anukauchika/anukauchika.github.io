/**
 * Generates realistic practice stats for the chinese-test dataset.
 * Seeds IDB directly via bulk insert — no server sync.
 *
 * Per-word success counts range from ~1 to ~150.
 * Groups 1-2 are heavily practiced, group 5 is barely touched.
 *
 * Usage (browser console):
 *   import('/src/data/seed-test-stats.js').then(m => m.seed())
 */
import * as idb from './idb-stats.js'

const DATASET_CODE = 'ae'   // chinese-test
const PRACTICE_TYPE = 's'   // stroke

// Test dataset: 5 groups, 3 words each
const GROUPS = [
  { group: 1, words: [1, 2, 3] },
  { group: 2, words: [1, 2, 3] },
  { group: 3, words: [1, 2, 3] },
  { group: 4, words: [1, 2, 6] },
  { group: 5, words: [1, 2, 3] },
]

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function isoAt(date) {
  return date.toISOString()
}

export async function seed() {
  const now = new Date('2026-02-06T12:00:00')
  const monthAgo = new Date('2026-01-06T08:00:00')

  let sessionId = 900000
  let wordId = 900000
  const sessions = []
  const words = []
  const chars = []

  // Target per-word success counts: group 1 ~130-150, group 2 ~80-110,
  // group 3 ~30-50, group 4 ~10-20, group 5 ~1-5
  // Overshooting session counts to compensate for ~15% partial + future-date skips
  for (const g of GROUPS) {
    const sessionCount =
      g.group === 1 ? rand(160, 180) :
      g.group === 2 ? rand(100, 130) :
      g.group === 3 ? rand(40, 60) :
      g.group === 4 ? rand(12, 25) :
      rand(1, 5)

    for (let s = 0; s < sessionCount; s++) {
      const dayOffset = rand(0, 30)
      const hourOffset = rand(8, 21)
      const sessionDate = new Date(monthAgo)
      sessionDate.setDate(sessionDate.getDate() + dayOffset)
      sessionDate.setHours(hourOffset, rand(0, 59), rand(0, 59))

      if (sessionDate > now) continue

      const sid = sessionId++
      const startedAt = isoAt(sessionDate)

      // ~85% full sessions
      const isFull = Math.random() < 0.85
      const doneDate = new Date(sessionDate.getTime() + rand(2, 8) * 60000)
      const doneAt = isFull ? isoAt(doneDate) : null

      sessions.push({
        id: sid,
        user_id: null,
        dataset_id: DATASET_CODE,
        practice_type: PRACTICE_TYPE,
        group_id: g.group,
        started_at: startedAt,
        done_at: doneAt,
        synced: 1,
      })

      const wordsToAttempt = isFull ? g.words : g.words.slice(0, rand(1, g.words.length - 1))
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

        // Char logs — fewer errors for heavily practiced groups
        const charCount = rand(1, 2)
        const errorChance = g.group <= 2 ? 0.1 : g.group <= 4 ? 0.25 : 0.4
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
  console.log('Reload the page and select "Chinese Test" dataset to see the data.')
}
