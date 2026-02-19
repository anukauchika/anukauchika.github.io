import { datDrillSync } from '@dat/kind/chinese/drill'

export interface SyncService {
  syncPending(): Promise<void>
  restoreFromServer(): Promise<void>
}

let syncing = false

async function syncPending(): Promise<void> {
  if (syncing) return
  syncing = true
  try {
    // 1a. New drills (temp ID < 0)
    const allPending = await datDrillSync.getPendingDrills()
    const newDrills = allPending.filter((s) => s.id < 0)
    for (const s of newDrills) {
      const { id: realId } = await datDrillSync.pushDrillToRemote(s)
      await datDrillSync.syncDrill(s.id, realId)
    }

    // 1b. Updated drills (real ID, need done_at push)
    const updatedDrills = allPending.filter((s) => s.id > 0)
    for (const s of updatedDrills) {
      await datDrillSync.pushDrillDoneToRemote(s.id, s.done_at!)
      await datDrillSync.syncDrill(s.id, s.id)
    }

    // 2. Word attempts (only if drill already synced — positive session ID)
    const allPendingAttempts = await datDrillSync.getPendingAttempts()
    const attempts = allPendingAttempts.filter((w) => w.group_session_id > 0)
    for (const w of attempts) {
      const { id: realId } = await datDrillSync.pushAttemptToRemote(w)
      await datDrillSync.syncAttempt(w.id, realId)
    }

    // 3. Char logs (only if word attempt already synced — positive ID)
    const allPendingChars = await datDrillSync.getPendingCharLogs()
    const chars = allPendingChars.filter((c) => c.word_attempt_id > 0)
    if (chars.length > 0) {
      await datDrillSync.pushCharLogsToRemote(chars)
    }
  } finally {
    syncing = false
  }
}

async function restoreFromServer(): Promise<void> {
  await datDrillSync.restoreFromServer()
}

export const svcSync: SyncService = {
  syncPending,
  restoreFromServer,
}
