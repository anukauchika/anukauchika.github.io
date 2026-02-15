import { statsRepo } from '@app/data/idb-stats-repo'
import type { MaintenanceService } from '@app/api/maintenance-service'

const CLEANUP_KEY = 'uch-stats-last-cleanup'
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000
const RETENTION_MS = 90 * 24 * 60 * 60 * 1000

function runStartupTasks(): void {
  // Legacy database cleanup — safe to remove after 2026-03-06
  indexedDB.deleteDatabase('memris-stats')
  indexedDB.deleteDatabase('memris-stats-v2')
  indexedDB.deleteDatabase('memris-prefs')

  runCleanup().catch((e) => console.error('stats cleanup failed', e))
}

async function runCleanup(): Promise<void> {
  const last = localStorage.getItem(CLEANUP_KEY)
  if (last && Date.now() - Number(last) < CLEANUP_INTERVAL_MS) return

  const cutoff = new Date(Date.now() - RETENTION_MS).toISOString()
  await statsRepo.deleteOldSyncedRecords(cutoff)
  localStorage.setItem(CLEANUP_KEY, String(Date.now()))
}

export const maintenanceService: MaintenanceService = {
  runStartupTasks,
  runCleanup,
}
