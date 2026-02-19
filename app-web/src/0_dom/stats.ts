export type DayKey = string // "YYYY-MM-DD"

export interface WordProgress {
  successCount: number
  errorCount: number
  lastDrilledAt: string | null
}

export interface GroupProgress {
  total: number
  full: number
  lastDrilledAt: string | null
  lastFullDrillAt: string | null
}

export interface DayProgress {
  count: number
  durationMs: number
  sessions: number
}
