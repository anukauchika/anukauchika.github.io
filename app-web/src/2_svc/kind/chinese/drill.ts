import type { GroupId, DatasetId, WordId } from '@dom/dataset'
import type { WordProgress, GroupProgress } from '@dom/stats'
import type { WordAttempt, GroupAttempt, DrillId } from '@dom/drill'
import { ChineseDrillType } from '@dom/kind/chinese/dataset'
import type { ChineseWord, ChineseGroup } from '@dom/kind/chinese/dataset'
import { asChineseDataset } from '@dom/kind/chinese/dataset'
import type { CharAttempt } from '@dom/kind/chinese/drill'
import { datDrill } from '@dat/kind/chinese/drill'
import { datAnalytics } from '@dat/analytics'
import { sttDataset } from '@stt/dataset.svelte.js'
import { sttStats } from '@stt/kind/chinese/stats.svelte.js'
import { sttAuth } from '@stt/auth.svelte.js'
import { svcSync } from '@svc/sync'
import { dsCode, dtCode } from '@svc/kind/chinese/codes'
import { calcWordSortScore } from '@std/kind/chinese/stats'

function sortByProgress(items: ChineseWord[], wp: Map<number, WordProgress>, drillType: ChineseDrillType): ChineseWord[] {
  return [...items].sort((a, b) =>
    calcWordSortScore(wp.get(a.id), drillType) - calcWordSortScore(wp.get(b.id), drillType)
  )
}

// --- DrillHandle ---

export interface DrillHandle {
  group: ChineseGroup
  items: ChineseWord[]
  wordProgress: Map<WordId, WordProgress>
  groupProgressStroke: GroupProgress | null
  groupProgressPinyin: GroupProgress | null
  authenticated: boolean
  recordAttempt(attempt: WordAttempt, chars: CharAttempt[]): Promise<void>
  endSession(result: GroupAttempt): Promise<void>
}

async function initDrill(datasetId: DatasetId, groupId: GroupId, drillType: ChineseDrillType): Promise<DrillHandle> {
  const ds = asChineseDataset(sttDataset.current)
  if (!ds) throw new Error(`Dataset ${datasetId} not found or not chinese`)

  const group = ds.groups.find((g) => g.id === groupId)
  if (!group) throw new Error(`Group ${groupId} not found in dataset ${datasetId}`)

  const datasetCode = dsCode(datasetId)
  const drillCode = dtCode(drillType)
  const authenticated = sttAuth.isAuthenticated

  // Anon drills are never persisted, so a local progress read here is
  // guaranteed empty — skip the IDB walk and the now-pointless sort.
  const wp = authenticated
    ? await datDrill.getGroupWordsProgress(datasetCode, drillCode, groupId)
    : new Map<WordId, WordProgress>()
  const items = authenticated ? sortByProgress(group.items, wp, drillType) : group.items
  const groupProgressStroke = sttStats.groupProgressStroke.get(groupId) ?? null
  const groupProgressPinyin = sttStats.groupProgressPinyin.get(groupId) ?? null

  let sessionIdPromise: Promise<DrillId> | null = null
  let drillId: DrillId | null = null
  let sessionHintCount = 0
  let pendingAttempts: Promise<void>[] = []

  datAnalytics.track('drill_started', {
    drill_type: drillType,
    dataset_id: datasetId,
    group_id: groupId,
    authenticated,
  })

  return {
    group,
    items,
    wordProgress: wp,
    groupProgressStroke,
    groupProgressPinyin,
    authenticated,

    recordAttempt(attempt: WordAttempt, chars: CharAttempt[]): Promise<void> {
      if (!authenticated) return Promise.resolve()

      const pending = (async () => {
        if (!sessionIdPromise) {
          sessionIdPromise = datDrill.startDrill(
            sttAuth.user?.id ?? null, datasetCode, drillCode, groupId,
          ).then((id) => { drillId = id; return id })
        }

        try {
          const sid = await sessionIdPromise
          await datDrill.recordAttempt(sid, attempt, chars)
          svcSync.syncPending().catch((e) => console.error('sync failed', e))

          sessionHintCount += chars.reduce((sum, c) => sum + (c.hintCount || 0), 0)
        } catch (e) {
          console.error('recordAttempt failed', e)
        }
      })()
      pendingAttempts = [...pendingAttempts, pending]
      return pending
    },

    async endSession(result: GroupAttempt): Promise<void> {
      datAnalytics.track('drill_completed', {
        drill_type: drillType,
        dataset_id: datasetId,
        group_id: groupId,
        drilled: result.drilledCount,
        skipped: result.skippedCount,
        authenticated,
      })

      await Promise.allSettled(pendingAttempts)
      pendingAttempts = []

      if (result.drilledCount === 0 || drillId == null) return

      const session = await datDrill.endDrill(drillId)
      if (!session) return

      if (authenticated) await svcSync.syncPending().catch((e) => console.error('sync failed', e))
      else svcSync.syncPending().catch((e) => console.error('sync failed', e))

      const doneAt = session.done_at ?? new Date().toISOString()
      const startedAt = session.started_at ?? doneAt
      const updateGpMap = (map: Map<number, GroupProgress>): Map<number, GroupProgress> => {
        const next = new Map(map)
        const existing = next.get(groupId)
        const clean = sessionHintCount === 0
        next.set(groupId, {
          total: (existing?.total ?? 0) + 1,
          full: (existing?.full ?? 0) + 1,
          clean: (existing?.clean ?? 0) + (clean ? 1 : 0),
          firstDrilledAt: existing?.firstDrilledAt ?? startedAt,
          lastDrilledAt: doneAt > (existing?.lastDrilledAt ?? '') ? doneAt : existing?.lastDrilledAt ?? doneAt,
          lastFullDrillAt: doneAt > (existing?.lastFullDrillAt ?? '') ? doneAt : existing?.lastFullDrillAt ?? doneAt,
          lastCleanDrillAt: clean && doneAt > (existing?.lastCleanDrillAt ?? '') ? doneAt : existing?.lastCleanDrillAt ?? null,
          lastSessionHintCount: doneAt > (existing?.lastFullDrillAt ?? '') ? sessionHintCount : existing?.lastSessionHintCount ?? sessionHintCount,
        })
        return next
      }
      const gpStoreKey = drillCode === 's' ? 'groupProgressStroke' : 'groupProgressPinyin'
      sttStats[gpStoreKey] = updateGpMap(sttStats[gpStoreKey] as Map<number, GroupProgress>)

      sessionIdPromise = null
      drillId = null
      sessionHintCount = 0
    },
  }
}

// --- Public interface ---

export interface DrillService {
  initDrill(datasetId: DatasetId, groupId: GroupId, drillType: ChineseDrillType): Promise<DrillHandle>
}

export const svcDrill: DrillService = {
  initDrill,
}
