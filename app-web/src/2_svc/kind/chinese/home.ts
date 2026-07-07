import type { DatasetId } from '@dom/dataset'
import type { ChineseGroup } from '@dom/kind/chinese/dataset'
import type { ChineseHomeSummary } from '@dom/kind/chinese/stats'
import { datStats } from '@dat/kind/chinese/stats'
import { sttHome } from '@stt/kind/chinese/home.svelte.js'
import { sttAuth } from '@stt/auth.svelte.js'
import { sttDataset } from '@stt/dataset.svelte.js'
import { dsCode } from '@svc/kind/chinese/codes'
import { countDueDrills, calcNextDrill } from '@std/kind/chinese/stats'
import { localTimeZone } from '@std/format'

export interface HomeService {
  load(datasetId: DatasetId): Promise<void>
}

function apply(summary: ChineseHomeSummary): void {
  sttHome.todaySessions = summary.todaySessions
  sttHome.todayDurationMs = summary.todayDurationMs
  sttHome.dueCount = summary.dueCount
  sttHome.drilledWords = summary.drilledWords
  sttHome.next = summary.next
  sttHome.loaded = true
}

async function loadLocal(datasetId: DatasetId, groups: ChineseGroup[]): Promise<ChineseHomeSummary> {
  const code = dsCode(datasetId)
  const [strokeProgress, pinyinProgress, stats] = await Promise.all([
    datStats.getGroupProgress(code, 's'),
    datStats.getGroupProgress(code, 'p'),
    datStats.getLocalHomeStats(code),
  ])

  return {
    todaySessions: stats.todaySessions,
    todayDurationMs: stats.todayDurationMs,
    drilledWords: stats.drilledWords,
    dueCount: countDueDrills(groups, strokeProgress, pinyinProgress),
    next: calcNextDrill(groups, strokeProgress, pinyinProgress),
  }
}

const EMPTY_SUMMARY: ChineseHomeSummary = {
  todaySessions: 0,
  todayDurationMs: 0,
  dueCount: 0,
  drilledWords: 0,
  next: null,
}

async function load(datasetId: DatasetId): Promise<void> {
  // Anon drills are never persisted (svcDrill gates writes on auth), so any
  // local read here is guaranteed empty — skip it rather than pay for the walk.
  if (!sttAuth.isAuthenticated) {
    apply(EMPTY_SUMMARY)
    return
  }

  const groups = sttDataset.groups as ChineseGroup[]

  let summary: ChineseHomeSummary | null = null
  if (groups.length > 0) {
    try {
      summary = await datStats.getServerHomeSummary(dsCode(datasetId), groups.map((g) => g.id), localTimeZone())
    } catch (err) {
      console.error('home summary load failed, falling back to local:', err)
    }
  }
  if (!summary) summary = await loadLocal(datasetId, groups)

  if (sttDataset.id !== datasetId) return // stale — dataset changed mid-load
  apply(summary)
}

export const svcHome: HomeService = {
  load,
}
