import type { GroupId, DatasetId, WordKey, WordId } from '@dom/dataset'
import { mkWordKey } from '@dom/dataset'
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
import { localTimeZone } from '@std/format'

const DT_STORE_KEY: Record<string, 'wordProgressStroke' | 'wordProgressPinyin'> = {
  s: 'wordProgressStroke',
  p: 'wordProgressPinyin',
}

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

export interface NextDrill {
  groupId: number
  type: 'stroke' | 'pinyin'
  reason: 'repeat' | 'due' | 'new' | 'upcoming' | 'fallback'
  offline: boolean
}

const DRILL_CODE_TO_TYPE: Record<string, 'stroke' | 'pinyin'> = {
  s: 'stroke',
  p: 'pinyin',
}

function fallbackDrill(groups: ChineseGroup[], offline: boolean): NextDrill | null {
  const first = [...groups].sort((a, b) => a.id - b.id)[0]
  return first ? { groupId: first.id, type: 'stroke', reason: 'fallback', offline } : null
}

async function initDrill(datasetId: DatasetId, groupId: GroupId, drillType: ChineseDrillType): Promise<DrillHandle> {
  const ds = asChineseDataset(sttDataset.current)
  if (!ds) throw new Error(`Dataset ${datasetId} not found or not chinese`)

  const group = ds.groups.find((g) => g.id === groupId)
  if (!group) throw new Error(`Group ${groupId} not found in dataset ${datasetId}`)

  const datasetCode = dsCode(datasetId)
  const drillCode = dtCode(drillType)
  const wp = await datDrill.getGroupWordsProgress(datasetCode, drillCode, groupId)
  const items = sortByProgress(group.items, wp, drillType)
  const groupProgressStroke = sttStats.groupProgressStroke.get(groupId) ?? null
  const groupProgressPinyin = sttStats.groupProgressPinyin.get(groupId) ?? null
  const authenticated = sttAuth.isAuthenticated

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
          const result = await datDrill.recordAttempt(sid, attempt, chars)
          svcSync.syncPending().catch((e) => console.error('sync failed', e))

          const key = mkWordKey(groupId, attempt.wordId)
          const hintCount = chars.reduce((sum, c) => sum + (c.hintCount || 0), 0)
          sessionHintCount += hintCount
          const updateWpMap = (map: Map<WordKey, WordProgress>): Map<WordKey, WordProgress> => {
            const next = new Map(map)
            const ex = next.get(key)
            next.set(key, {
              successCount: (ex?.successCount ?? 0) + 1,
              errorCount: (ex?.errorCount ?? 0) + result.errorCount,
              hintCount: (ex?.hintCount ?? 0) + hintCount,
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
      sttStats.groupProgress = updateGpMap(sttStats.groupProgress)
      const gpStoreKey = drillCode === 's' ? 'groupProgressStroke' : 'groupProgressPinyin'
      sttStats[gpStoreKey] = updateGpMap(sttStats[gpStoreKey] as Map<number, GroupProgress>)

      sessionIdPromise = null
      drillId = null
      sessionHintCount = 0
    },
  }
}

async function pickNextDrillSuggestion(datasetId: DatasetId, groups: ChineseGroup[]): Promise<NextDrill | null> {
  if (!sttAuth.isAuthenticated) return fallbackDrill(groups, false)
  if (groups.length === 0) return null

  try {
    const next = await datDrill.getNextDrill(dsCode(datasetId), groups.map((g) => g.id), localTimeZone())
    if (!next) return fallbackDrill(groups, false)
    const type = DRILL_CODE_TO_TYPE[next.drillCode]
    if (!type) return fallbackDrill(groups, false)
    return {
      groupId: next.groupId,
      type,
      reason: next.reason as NextDrill['reason'],
      offline: false,
    }
  } catch (e) {
    console.error('next drill lookup failed', e)
    return fallbackDrill(groups, true)
  }
}

// --- Public interface ---

export interface DrillService {
  initDrill(datasetId: DatasetId, groupId: GroupId, drillType: ChineseDrillType): Promise<DrillHandle>
  pickNextDrill(datasetId: DatasetId, groups: ChineseGroup[]): Promise<NextDrill | null>
}

export const svcDrill: DrillService = {
  initDrill,
  pickNextDrill: pickNextDrillSuggestion,
}
