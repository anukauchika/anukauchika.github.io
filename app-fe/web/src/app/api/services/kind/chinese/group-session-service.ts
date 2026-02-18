import type { GroupSession, PracticeType } from '@app/api/data/kind/chinese/types'
import type { CharAttemptInput, WordAttemptResult } from './types'

export interface GroupSessionService {
  startGroupSession(
    userId: string | null,
    datasetId: string,
    practiceType: PracticeType,
    groupId: number,
  ): Promise<number>

  endGroupSession(sessionId: number): Promise<GroupSession | null>

  recordWordAttempt(
    sessionId: number,
    wordId: number,
    startedAt: string,
    doneAt: string,
    chars: CharAttemptInput[],
  ): Promise<WordAttemptResult>
}
