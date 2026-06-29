export type DayKey = string // "YYYY-MM-DD"

export interface WordProgress {
  successCount: number
  errorCount: number
  hintCount: number
  lastDrilledAt: string | null
}

export interface GroupProgress {
  total: number
  full: number
  clean: number
  firstDrilledAt: string | null
  lastDrilledAt: string | null
  lastFullDrillAt: string | null
  lastCleanDrillAt: string | null
  lastSessionHintCount: number | null
  reviewState?: 'new' | 'repeat' | 'due' | 'upcoming'
  dueAt?: string | null
  intervalDays?: number | null
}

export interface DayProgress {
  count: number
  durationMs: number
  sessions: number
}
