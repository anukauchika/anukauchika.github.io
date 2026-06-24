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
import { calcWordSortScore, calcTypeReview } from '@std/kind/chinese/stats'
import type { TypeReview } from '@std/kind/chinese/stats'

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
  let sessionHintCount = 0

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

      if (result.drilledCount === 0 || drillId == null) return

      const session = await datDrill.endDrill(drillId)
      if (!session) return

      svcSync.syncPending().catch((e) => console.error('sync failed', e))

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

function pickNextDrillPure(
  groups: ChineseGroup[],
  strokeSessions: Map<GroupId, GroupProgress>,
  pinyinSessions: Map<GroupId, GroupProgress>,
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

  interface Candidate {
    group: ChineseGroup
    type: 'stroke' | 'pinyin'
    review: TypeReview
    rank: number
    queuedAt: number
  }

  const ts = (value: string | null | undefined) => value ? new Date(value).getTime() : Infinity
  const candidates: Candidate[] = []

  for (const group of activeGroups) {
    const stroke = strokeSessions.get(group.id)
    const pinyin = pinyinSessions.get(group.id)
    const groupQueuedAt = Math.min(ts(stroke?.firstDrilledAt), ts(pinyin?.firstDrilledAt))

    const add = (type: 'stroke' | 'pinyin', gp: GroupProgress | undefined) => {
      const review = calcTypeReview(gp)
      let rank: number
      if (review.state === 'repeat') rank = 0
      else if (review.state === 'due') rank = 1
      else if (review.state === 'new') rank = 2
      else rank = 4
      candidates.push({ group, type, review, rank, queuedAt: groupQueuedAt })
    }

    add('stroke', stroke)
    add('pinyin', pinyin)
  }

  const typeOrder = (type: 'stroke' | 'pinyin') => type === 'stroke' ? 0 : 1
  const pickBest = (items: Candidate[]) => items.reduce((a, b) => {
    if (a.rank !== b.rank) return a.rank < b.rank ? a : b
    if (a.review.dueAt !== b.review.dueAt) return a.review.dueAt < b.review.dueAt ? a : b
    if (a.queuedAt !== b.queuedAt) return a.queuedAt < b.queuedAt ? a : b
    if (a.group.id !== b.group.id) return a.group.id < b.group.id ? a : b
    return typeOrder(a.type) <= typeOrder(b.type) ? a : b
  })

  const immediate = candidates.filter((c) => c.rank <= 2)
  if (immediate.length > 0) {
    const selected = pickBest(immediate)
    return { groupId: selected.group.id, type: selected.type }
  }

  // All active work is scheduled for the future — introduce the next new group.
  const maxActiveId = Math.max(...activeGroups.map((g) => g.id))
  const nextNew = groups.find((g) =>
    g.id === maxActiveId + 1 &&
    (strokeSessions.get(g.id)?.full ?? 0) === 0 &&
    (pinyinSessions.get(g.id)?.full ?? 0) === 0
  )
  if (nextNew) return { groupId: nextNew.id, type: 'stroke' }

  const selected = pickBest(candidates)
  return { groupId: selected.group.id, type: selected.type }
}

function pickNextDrillSuggestion(): NextDrill | null {
  if (sttAuth.isAuthenticated) {
    return pickNextDrillPure(
      sttDataset.filtered as ChineseGroup[],
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
