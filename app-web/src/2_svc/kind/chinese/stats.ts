import type { DatasetId, WordKey } from '@dom/dataset'
import type { WordProgress, GroupProgress, DayProgress } from '@dom/stats'
import { datStats } from '@dat/kind/chinese/stats'
import { sttStats } from '@stt/kind/chinese/stats.svelte.js'
import { sttAuth } from '@stt/auth.svelte.js'
import { sttDataset } from '@stt/dataset.svelte.js'
import { dsCode, dtCode, ALL_DT } from '@svc/kind/chinese/codes'

export interface StatsService {
  loadWordProgressAll(datasetId: DatasetId): Promise<void>
  loadGroupProgressAll(datasetId: DatasetId): Promise<void>
  loadDayProgressAll(datasetId: DatasetId): Promise<void>
}

async function loadWordProgressAll(datasetId: DatasetId): Promise<void> {
  const merged = new Map<WordKey, WordProgress>()
  const perType: Record<string, Map<WordKey, WordProgress>> = { s: new Map(), p: new Map() }

  for (const dt of ALL_DT) {
    const code = dtCode(dt)
    const ptMap = perType[code]
    const stats = await datStats.getWordProgress(dsCode(datasetId), code)
    for (const [key, wp] of stats) {
      ptMap.set(key, { ...wp })
      const existing = merged.get(key)
      if (existing) {
        existing.successCount += wp.successCount
        existing.errorCount += wp.errorCount
        existing.hintCount += wp.hintCount
        if (wp.lastDrilledAt && (!existing.lastDrilledAt || wp.lastDrilledAt > existing.lastDrilledAt)) {
          existing.lastDrilledAt = wp.lastDrilledAt
        }
      } else {
        merged.set(key, { ...wp })
      }
    }
  }
  sttStats.wordProgress = merged
  sttStats.wordProgressStroke = perType.s
  sttStats.wordProgressPinyin = perType.p
}

async function loadGroupProgressAll(datasetId: DatasetId): Promise<void> {
  if (sttAuth.isAuthenticated) {
    const groups = sttDataset.groups
    if (groups.length > 0) {
      try {
        const perType = await datStats.getGroupReviewProgress(dsCode(datasetId), groups.map((g) => g.id))
        setGroupProgressMaps(perType)
        return
      } catch (err) {
        console.error('Failed to load server group review state:', err)
      }
    }
  }

  const merged = new Map<number, GroupProgress>()
  const perType: Record<string, Map<number, GroupProgress>> = { s: new Map(), p: new Map() }

  for (const dt of ALL_DT) {
    const code = dtCode(dt)
    const ptMap = perType[code]
    const gp = await datStats.getGroupProgress(dsCode(datasetId), code)
    for (const [groupId, summary] of gp) {
      ptMap.set(groupId, { ...summary })
      mergeGroupProgress(merged, groupId, summary)
    }
  }
  sttStats.groupProgress = merged
  sttStats.groupProgressStroke = perType.s
  sttStats.groupProgressPinyin = perType.p
}

function setGroupProgressMaps(perType: Record<string, Map<number, GroupProgress>>): void {
  const merged = new Map<number, GroupProgress>()

  for (const [groupId, summary] of perType.s) mergeGroupProgress(merged, groupId, summary)
  for (const [groupId, summary] of perType.p) mergeGroupProgress(merged, groupId, summary)

  sttStats.groupProgress = merged
  sttStats.groupProgressStroke = perType.s
  sttStats.groupProgressPinyin = perType.p
}

function mergeGroupProgress(map: Map<number, GroupProgress>, groupId: number, summary: GroupProgress): void {
  const existing = map.get(groupId)
  if (existing) {
    existing.total += summary.total
    existing.full += summary.full
    existing.clean += summary.clean
    if (summary.firstDrilledAt && (!existing.firstDrilledAt || summary.firstDrilledAt < existing.firstDrilledAt)) {
      existing.firstDrilledAt = summary.firstDrilledAt
    }
    if (summary.lastCleanDrillAt && (!existing.lastCleanDrillAt || summary.lastCleanDrillAt > existing.lastCleanDrillAt)) {
      existing.lastCleanDrillAt = summary.lastCleanDrillAt
    }
    if (summary.lastFullDrillAt && (!existing.lastFullDrillAt || summary.lastFullDrillAt > existing.lastFullDrillAt)) {
      existing.lastFullDrillAt = summary.lastFullDrillAt
      existing.lastSessionHintCount = summary.lastSessionHintCount
    }
    if (summary.lastDrilledAt && (!existing.lastDrilledAt || summary.lastDrilledAt > existing.lastDrilledAt)) {
      existing.lastDrilledAt = summary.lastDrilledAt
    }
  } else {
    map.set(groupId, { ...summary })
  }
}

async function loadDayProgressAll(datasetId: DatasetId): Promise<void> {
  try {
    if (sttAuth.isAuthenticated && sttDataset.groups.length > 0) {
      sttStats.dayProgress = await datStats.getServerDayProgress(
        dsCode(datasetId),
        sttDataset.groups.map((g) => g.id),
      )
      return
    }

    const merged = new Map<string, DayProgress>()
    for (const dt of ALL_DT) {
      const map = await datStats.getDayProgress(dsCode(datasetId), dtCode(dt))
      for (const [dateKey, activity] of map) {
        const existing = merged.get(dateKey)
        if (existing) {
          existing.count += activity.count
          existing.durationMs += activity.durationMs
          existing.sessions += activity.sessions
        } else {
          merged.set(dateKey, { ...activity })
        }
      }
    }
    sttStats.dayProgress = merged
  } catch (err) {
    console.error('Failed to load daily activity:', err)
  }
}

export const svcStats: StatsService = {
  loadWordProgressAll,
  loadGroupProgressAll,
  loadDayProgressAll,
}
