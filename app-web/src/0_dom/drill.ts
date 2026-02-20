import type { WordId } from '@dom/dataset'

export type DrillId = number

export interface WordAttempt {
  wordId: WordId
  startedAt: string
  doneAt: string
}

export interface GroupAttempt {
  drilledCount: number
  skippedCount: number
}
