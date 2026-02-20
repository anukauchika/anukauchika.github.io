import type { GroupId, DatasetId, WordKey, WordId } from '@dom/dataset'
import { mkWordKey } from '@dom/dataset'
import type { WordProgress, GroupProgress } from '@dom/stats'
import type { WordAttempt, GroupAttempt, DrillId } from '@dom/drill'
import { ChineseDrillType } from '@dom/kind/chinese/dataset'
import type { ChineseWord, ChineseGroup } from '@dom/kind/chinese/dataset'
import { asChineseDataset } from '@dom/kind/chinese/dataset'
import type { CharAttempt } from '@dom/kind/chinese/drill'
import type { Group } from '@dom/dataset'
import { datDrill } from '@dat/kind/chinese/drill'
import { sttDataset } from '@stt/dataset.svelte.js'
import { sttStats } from '@stt/kind/chinese/stats.svelte.js'
import { sttAuth } from '@stt/auth.svelte.js'
import { svcSync } from '@svc/sync'
import { dsCode, dtCode } from '@svc/kind/chinese/codes'

const DT_STORE_KEY: Record<string, 'wordProgressStroke' | 'wordProgressPinyin'> = {
  s: 'wordProgressStroke',
  p: 'wordProgressPinyin',
}

function sortByProgress(items: ChineseWord[], wp: Map<number, WordProgress>): ChineseWord[] {
  return [...items].sort((a, b) => {
    const ca = wp.get(a.id)?.successCount ?? 0
    const cb = wp.get(b.id)?.successCount ?? 0
    return ca - cb
  })
}

// --- DrillHandle ---

export interface DrillHandle {
  group: ChineseGroup
  items: ChineseWord[]
  wordProgress: Map<WordId, WordProgress>
  groupProgress: GroupProgress | null
  authenticated: boolean
  recordAttempt(attempt: WordAttempt, chars: CharAttempt[]): Promise<void>
  endSession(result: GroupAttempt): Promise<void>
}

interface NextDrill {
  groupId: number
  type: 'stroke' | 'pinyin'
}

async function initDrill(datasetId: DatasetId, groupId: GroupId, drillType: ChineseDrillType): Promise<DrillHandle> {
  const ds = asChineseDataset(sttDataset.current)
  if (!ds) throw new Error(`Dataset ${datasetId} not found or not chinese`)

  const group = ds.groups.find((g) => g.id === groupId)
  if (!group) throw new Error(`Group ${groupId} not found in dataset ${datasetId}`)

  const datasetCode = dsCode(datasetId)
  const drillCode = dtCode(drillType)
  const wp = await datDrill.getGroupWordsProgress(datasetCode, drillCode, groupId)
  const items = sortByProgress(group.items, wp)
  const groupProgress = sttStats.groupProgress.get(groupId) ?? null
  const authenticated = sttAuth.isAuthenticated

  let sessionIdPromise: Promise<DrillId> | null = null
  let drillId: DrillId | null = null

  return {
    group,
    items,
    wordProgress: wp,
    groupProgress,
    authenticated,

    async recordAttempt(attempt: WordAttempt, chars: CharAttempt[]): Promise<void> {
      if (!authenticated) return

      if (!sessionIdPromise) {
        sessionIdPromise = datDrill.startDrill(
          sttAuth.user?.id ?? null, datasetCode, drillCode, groupId,
        ).then((id) => { drillId = id; return id })
      }

      try {
        const sid = await sessionIdPromise
        const result = await datDrill.recordAttempt(sid, attempt, chars)
        svcSync.syncPending().catch((e) => console.error('sync failed', e))

        const key = mkWordKey(groupId, attempt.wordId)
        const updateWpMap = (map: Map<WordKey, WordProgress>): Map<WordKey, WordProgress> => {
          const next = new Map(map)
          const ex = next.get(key)
          next.set(key, {
            successCount: (ex?.successCount ?? 0) + 1,
            errorCount: (ex?.errorCount ?? 0) + result.errorCount,
            lastDrilledAt: attempt.doneAt,
          })
          return next
        }
        sttStats.wordProgress = updateWpMap(sttStats.wordProgress)
        const wpStoreKey = DT_STORE_KEY[drillCode]
        if (wpStoreKey) sttStats[wpStoreKey] = updateWpMap(sttStats[wpStoreKey])
      } catch (e) {
        console.error('recordAttempt failed', e)
      }
    },

    async endSession(result: GroupAttempt): Promise<void> {
      if (result.drilledCount === 0 || drillId == null) return

      const session = await datDrill.endDrill(drillId)
      if (!session) return

      svcSync.syncPending().catch((e) => console.error('sync failed', e))

      const doneAt = session.done_at ?? new Date().toISOString()
      const updateGpMap = (map: Map<number, GroupProgress>): Map<number, GroupProgress> => {
        const next = new Map(map)
        const existing = next.get(groupId)
        if (existing) {
          next.set(groupId, {
            ...existing, full: existing.full + 1,
            lastFullDrillAt: doneAt > (existing.lastFullDrillAt ?? '') ? doneAt : existing.lastFullDrillAt,
          })
        }
        return next
      }
      sttStats.groupProgress = updateGpMap(sttStats.groupProgress)
      const gpStoreKey = drillCode === 's' ? 'groupProgressStroke' : 'groupProgressPinyin'
      sttStats[gpStoreKey] = updateGpMap(sttStats[gpStoreKey] as Map<number, GroupProgress>)

      sessionIdPromise = null
      drillId = null
    },
  }
}

function pickNextDrillPure(
  groups: Group[],
  groupSessions: Map<GroupId, GroupProgress>,
  strokeSessions: Map<GroupId, GroupProgress>,
  pinyinSessions: Map<GroupId, GroupProgress>,
): NextDrill | null {
  const eligible = groups.filter((g) => {
    const gs = groupSessions.get(g.id)
    return gs && gs.full >= 1
  })
  if (eligible.length === 0) return null

  eligible.sort((a, b) => {
    const aTime = groupSessions.get(a.id)!.lastDrilledAt || ''
    const bTime = groupSessions.get(b.id)!.lastDrilledAt || ''
    return aTime < bTime ? -1 : aTime > bTime ? 1 : 0
  })

  const groupId = eligible[0].id
  const strokeFull = strokeSessions.get(groupId)?.full ?? 0
  const pinyinFull = pinyinSessions.get(groupId)?.full ?? 0
  const type = pinyinFull < strokeFull ? 'pinyin' : 'stroke'

  return { groupId, type }
}

function pickNextDrillSuggestion(): NextDrill | null {
  if (sttAuth.isAuthenticated) {
    return pickNextDrillPure(
      sttDataset.filtered,
      sttStats.groupProgress,
      sttStats.groupProgressStroke,
      sttStats.groupProgressPinyin,
    )
  }
  return sttDataset.filtered.length > 0 ? { groupId: sttDataset.filtered[0].id, type: 'stroke' } : null
}

// --- Public interface ---

export interface DrillService {
  initDrill(datasetId: DatasetId, groupId: GroupId, drillType: ChineseDrillType): Promise<DrillHandle>
  pickNextDrill(): NextDrill | null
}

export const svcDrill: DrillService = {
  initDrill,
  pickNextDrill: pickNextDrillSuggestion,
}
