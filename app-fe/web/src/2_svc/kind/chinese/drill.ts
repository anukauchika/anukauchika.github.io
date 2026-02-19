import type { GroupId, DatasetId, WordKey } from '@dom/dataset'
import { mkWordKey } from '@dom/dataset'
import type { WordProgress, GroupProgress } from '@dom/stats'
import type { DrillId, WordAttempt } from '@dom/drill'
import { ChineseDrillType } from '@dom/kind/chinese/dataset'
import type { CharAttempt } from '@dom/kind/chinese/drill'
import { datDrill } from '@dat/kind/chinese/drill'
import { sttDrill } from '@stt/kind/chinese/drill.svelte.js'
import { sttStats } from '@stt/kind/chinese/stats.svelte.js'
import { sttDataset } from '@stt/dataset.svelte.js'
import { svcSync } from '@svc/sync'

const DT_CODES: Record<string, string> = { stroke: 's', pinyin: 'p' }
const DT_STORE_KEY: Record<string, 'wordProgressStroke' | 'wordProgressPinyin'> = { s: 'wordProgressStroke', p: 'wordProgressPinyin' }

function dsCode(id: DatasetId): string {
  const meta = sttDataset.meta.find((m) => m.id === id)
  return meta?.code ?? id
}

function dtCode(drillType: ChineseDrillType): string {
  return DT_CODES[drillType] || drillType
}

export interface DrillService {
  loadProgress(datasetId: DatasetId, drillType: ChineseDrillType, groupId: GroupId): Promise<void>
  startDrill(datasetId: DatasetId, drillType: ChineseDrillType, groupId: GroupId): Promise<DrillId>
  endDrill(drillId: DrillId): Promise<void>
  recordAttempt(drillId: DrillId, attempt: WordAttempt, chars: CharAttempt[]): Promise<void>
}

async function loadProgress(datasetId: DatasetId, drillType: ChineseDrillType, groupId: GroupId): Promise<void> {
  const map = await datDrill.getGroupWordsProgress(dsCode(datasetId), dtCode(drillType), groupId)
  sttDrill.progress = map
}

async function startDrillFn(datasetId: DatasetId, drillType: ChineseDrillType, groupId: GroupId): Promise<DrillId> {
  const userId = (await import('@stt/auth.svelte.js')).sttAuth.user?.id ?? null
  const id = await datDrill.startDrill(userId, dsCode(datasetId), dtCode(drillType), groupId)
  sttDrill.drillId = id
  return id
}

async function endDrillFn(drillId: DrillId): Promise<void> {
  const session = await datDrill.endDrill(drillId)
  sttDrill.drillId = null

  if (!session) return

  svcSync.syncPending().catch((e) => console.error('sync failed', e))

  // Optimistically update group progress
  const groupId = session.group_id
  const updateGroupProgress = (map: Map<number, GroupProgress>): Map<number, GroupProgress> => {
    const next = new Map(map)
    const existing = next.get(groupId)
    if (existing) {
      next.set(groupId, {
        ...existing,
        full: existing.full + 1,
        lastFullDrillAt: session.done_at && session.done_at > (existing.lastFullDrillAt ?? '') ? session.done_at : existing.lastFullDrillAt,
      })
    }
    return next
  }

  sttStats.groupProgress = updateGroupProgress(sttStats.groupProgress)

  const dtStoreKey = session.practice_type === 's' ? 'groupProgressStroke' : 'groupProgressPinyin'
  sttStats[dtStoreKey] = updateGroupProgress(sttStats[dtStoreKey])
}

async function recordAttemptFn(drillId: DrillId, attempt: WordAttempt, chars: CharAttempt[]): Promise<void> {
  const result = await datDrill.recordAttempt(drillId, attempt, chars)

  svcSync.syncPending().catch((e) => console.error('sync failed', e))

  const { groupId, drillCode, errorCount: attemptErrors } = result

  // Update drill progress (group-level)
  const drillMap = new Map(sttDrill.progress)
  const existing = drillMap.get(attempt.wordId)
  drillMap.set(attempt.wordId, {
    successCount: (existing?.successCount ?? 0) + 1,
    errorCount: (existing?.errorCount ?? 0) + attemptErrors,
    lastDrilledAt: attempt.doneAt,
  })
  sttDrill.progress = drillMap

  // Update dataset-wide word progress (merged + per-type)
  const key = mkWordKey(groupId, attempt.wordId)
  const updateWordProgress = (map: Map<WordKey, WordProgress>): Map<WordKey, WordProgress> => {
    const next = new Map(map)
    const ex = next.get(key)
    next.set(key, {
      successCount: (ex?.successCount ?? 0) + 1,
      errorCount: (ex?.errorCount ?? 0) + attemptErrors,
      lastDrilledAt: attempt.doneAt,
    })
    return next
  }

  sttStats.wordProgress = updateWordProgress(sttStats.wordProgress)

  const wpStoreKey = DT_STORE_KEY[drillCode]
  if (wpStoreKey) {
    sttStats[wpStoreKey] = updateWordProgress(sttStats[wpStoreKey])
  }
}

export const svcDrill: DrillService = {
  loadProgress,
  startDrill: startDrillFn,
  endDrill: endDrillFn,
  recordAttempt: recordAttemptFn,
}
