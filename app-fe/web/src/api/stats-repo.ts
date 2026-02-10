import type { CharLog, GroupSession, PracticeType, WordAttempt } from './types'

export interface StatsRepo {
  // Session CRUD
  saveGroupSession(session: GroupSession): Promise<void>
  getGroupSessionById(id: number): Promise<GroupSession | null>
  getGroupSessions(datasetId: string, practiceType: PracticeType): Promise<GroupSession[]>

  // Word attempt CRUD
  saveWordAttempt(attempt: WordAttempt): Promise<void>
  getWordAttempts(groupSessionId: number): Promise<WordAttempt[]>

  // Char log CRUD
  saveCharLogs(chars: CharLog[]): Promise<void>
  getCharLogs(wordAttemptId: number): Promise<CharLog[]>

  // Sync reads
  getPendingGroupSessions(): Promise<GroupSession[]>
  getPendingWordAttempts(): Promise<WordAttempt[]>
  getPendingCharLogs(): Promise<CharLog[]>

  // Sync writes
  markGroupSessionSynced(tempId: number, realId: number): Promise<void>
  markWordAttemptSynced(tempId: number, realId: number): Promise<void>

  // Bulk restore
  bulkInsertGroupSessions(sessions: GroupSession[]): Promise<void>
  bulkInsertWordAttempts(attempts: WordAttempt[]): Promise<void>
  bulkInsertCharLogs(chars: CharLog[]): Promise<void>

  // Utils
  isEmpty(): Promise<boolean>
  getMinId(): Promise<number>
  nextTempId(): Promise<number>

  // Cleanup
  deleteOldSyncedRecords(cutoffDate: string): Promise<void>

  // Lifecycle
  switchDatabase(userId: string | null): Promise<void>
}
