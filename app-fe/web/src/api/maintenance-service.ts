export interface MaintenanceService {
  runStartupTasks(): void
  runCleanup(): Promise<void>
}
