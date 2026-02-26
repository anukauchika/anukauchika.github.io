import type { GroupId, DatasetId, WordKey, WordId } from '@dom/dataset'
import { mkWordKey } from '@dom/dataset'
import type { WordProgress, GroupProgress } from '@dom/stats'
import type { WordAttempt, GroupAttempt, DrillId } from '@dom/drill'
import { ChineseDrillType } from '@dom/kind/chinese/dataset'
import type { ChineseWord, ChineseGroup } from '@dom/kind/chinese/dataset'
import { asChineseDataset } from '@dom/kind/chinese/dataset'
import type { CharAttempt } from '@dom/kind/chinese/drill'
import { datDrill } from '@dat/kind/chinese/drill'
import { sttDataset } from '@stt/dataset.svelte.js'
import { sttStats } from '@stt/kind/chinese/stats.svelte.js'
import { sttAuth } from '@stt/auth.svelte.js'
import { svcSync } from '@svc/sync'
import { dsCode, dtCode } from '@svc/kind/chinese/codes'
import { calcWordSortScore, calcTypeOverdueScore, calcGroupHintDifficulty } from '@std/kind/chinese/stats'

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
  const items = sortByProgress(group.items, wp, drillType)
  const groupProgressStroke = sttStats.groupProgressStroke.get(groupId) ?? null
  const groupProgressPinyin = sttStats.groupProgressPinyin.get(groupId) ?? null
  const authenticated = sttAuth.isAuthenticated

  let sessionIdPromise: Promise<DrillId> | null = null
  let drillId: DrillId | null = null

  return {
    group,
    items,
    wordProgress: wp,
    groupProgressStroke,
    groupProgressPinyin,
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
  groups: ChineseGroup[],
  strokeSessions: Map<GroupId, GroupProgress>,
  pinyinSessions: Map<GroupId, GroupProgress>,
  strokeWordProgress: Map<WordKey, WordProgress>,
  pinyinWordProgress: Map<WordKey, WordProgress>,
): NextDrill | null {
  const isActive = (g: ChineseGroup) =>
    (strokeSessions.get(g.id)?.full ?? 0) >= 1 || (pinyinSessions.get(g.id)?.full ?? 0) >= 1

  const activeGroups = groups.filter(isActive)

  if (activeGroups.length === 0) {
    // No active groups yet — start with the first unstarted group by id
    const first = [...groups].sort((a, b) => a.id - b.id)
      .find(g => (strokeSessions.get(g.id)?.full ?? 0) === 0 && (pinyinSessions.get(g.id)?.full ?? 0) === 0)
    return first ? { groupId: first.id, type: 'stroke' } : null
  }

  // Compute per-type overdue scores; group score = max of both types
  const withScores = activeGroups.map((g) => {
    const strokeScore = calcTypeOverdueScore(strokeSessions.get(g.id), calcGroupHintDifficulty(g, strokeWordProgress))
    const pinyinScore = calcTypeOverdueScore(pinyinSessions.get(g.id), calcGroupHintDifficulty(g, pinyinWordProgress))
    const score = Math.max(strokeScore, pinyinScore)
    const type: 'stroke' | 'pinyin' = pinyinScore >= strokeScore ? 'pinyin' : 'stroke'
    return { group: g, score, type }
  })

  const maxScore = Math.max(...withScores.map((x) => x.score))

  let selected: (typeof withScores)[0]
  if (maxScore >= 1) {
    selected = withScores.reduce((a, b) => (a.score > b.score ? a : b))
  } else {
    // All reviews ahead of schedule — introduce next new group
    const maxActiveId = Math.max(...activeGroups.map((g) => g.id))
    const nextNew = groups.find((g) =>
      g.id === maxActiveId + 1 &&
      (strokeSessions.get(g.id)?.full ?? 0) === 0 &&
      (pinyinSessions.get(g.id)?.full ?? 0) === 0
    )
    if (nextNew) return { groupId: nextNew.id, type: 'stroke' }
    selected = withScores.reduce((a, b) => (a.score > b.score ? a : b))
  }

  return { groupId: selected.group.id, type: selected.type }
}

function pickNextDrillSuggestion(): NextDrill | null {
  if (sttAuth.isAuthenticated) {
    return pickNextDrillPure(
      sttDataset.filtered as ChineseGroup[],
      sttStats.groupProgressStroke,
      sttStats.groupProgressPinyin,
      sttStats.wordProgressStroke,
      sttStats.wordProgressPinyin,
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
