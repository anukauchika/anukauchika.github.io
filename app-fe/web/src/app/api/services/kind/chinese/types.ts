import type { PracticeType } from '@app/api/data/kind/chinese/types'

// --- Service inputs ---

export interface CharAttemptInput {
  charIndex: number
  startedAt: string
  doneAt: string
  errorCount: number
}

// --- Service outputs ---

export interface WordAttemptResult {
  wordId: string
  groupId: string
  practiceType: PracticeType
  errorCount: number
}

// --- Derived (computed by services) ---

export interface WordStat {
  datasetId: string
  practiceType: PracticeType
  groupId: string
  wordId: string
  successCount: number
  errorCount: number
  lastPracticedAt: string | null
}

/** Value side of stats maps — the fields consumers actually read */
export interface StatEntry {
  successCount: number
  errorCount: number
  lastPracticedAt: string | null
}

export type StatsMap = Map<string, StatEntry>
export type SessionsMap = Map<string, GroupSessionSummary>
export type DailyActivityMap = Map<string, DailyActivity>

export interface GroupSessionSummary {
  total: number
  full: number
  lastPracticedAt: string | null
  lastFullSessionAt: string | null
}

export interface DailyActivity {
  count: number
  durationMs: number
  sessions: number
}
