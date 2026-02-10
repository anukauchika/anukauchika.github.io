export interface SyncService {
  setActiveSessionId(id: number | null): void
  syncPending(): Promise<void>
  restoreFromServer(): Promise<void>
}
