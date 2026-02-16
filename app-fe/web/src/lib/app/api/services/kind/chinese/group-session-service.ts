import type { GroupSession, PracticeType } from '@app/api/data/kind/chinese/types'
import type { CharAttemptInput, WordAttemptResult } from './types'

export interface GroupSessionService {
  startGroupSession(
    userId: string | null,
    datasetId: string,
    practiceType: PracticeType,
    groupId: string,
  ): Promise<number>

  endGroupSession(sessionId: number): Promise<GroupSession | null>

  recordWordAttempt(
    sessionId: number,
    wordId: string,
    startedAt: string,
    doneAt: string,
    chars: CharAttemptInput[],
  ): Promise<WordAttemptResult>
}
