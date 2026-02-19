import type { DatasetId, WordKey } from '@dom/dataset'
import type { WordProgress, GroupProgress, DayProgress } from '@dom/stats'
import { ChineseDrillType } from '@dom/kind/chinese/dataset'
import { datStats } from '@dat/kind/chinese/stats'
import { sttStats } from '@stt/kind/chinese/stats.svelte.js'
import { sttDataset } from '@stt/dataset.svelte.js'

const DT_CODES: Record<string, string> = { stroke: 's', pinyin: 'p' }
const ALL_DT = Object.values(ChineseDrillType)

function dsCode(id: DatasetId): string {
  const meta = sttDataset.meta.find((m) => m.id === id)
  return meta?.code ?? id
}

function dtCode(drillType: ChineseDrillType): string {
  return DT_CODES[drillType] || drillType
}

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
  const merged = new Map<number, GroupProgress>()
  const perType: Record<string, Map<number, GroupProgress>> = { s: new Map(), p: new Map() }

  for (const dt of ALL_DT) {
    const code = dtCode(dt)
    const ptMap = perType[code]
    const gp = await datStats.getGroupProgress(dsCode(datasetId), code)
    for (const [groupId, summary] of gp) {
      ptMap.set(groupId, { ...summary })
      const existing = merged.get(groupId)
      if (existing) {
        existing.total += summary.total
        existing.full += summary.full
        if (summary.lastFullDrillAt && (!existing.lastFullDrillAt || summary.lastFullDrillAt > existing.lastFullDrillAt)) {
          existing.lastFullDrillAt = summary.lastFullDrillAt
        }
        if (summary.lastDrilledAt && (!existing.lastDrilledAt || summary.lastDrilledAt > existing.lastDrilledAt)) {
          existing.lastDrilledAt = summary.lastDrilledAt
        }
      } else {
        merged.set(groupId, { ...summary })
      }
    }
  }
  sttStats.groupProgress = merged
  sttStats.groupProgressStroke = perType.s
  sttStats.groupProgressPinyin = perType.p
}

async function loadDayProgressAll(datasetId: DatasetId): Promise<void> {
  try {
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
