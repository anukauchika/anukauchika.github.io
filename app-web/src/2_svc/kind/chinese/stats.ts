import type { DatasetId } from '@dom/dataset'
import type { GroupProgress } from '@dom/stats'
import { datStats } from '@dat/kind/chinese/stats'
import { sttStats } from '@stt/kind/chinese/stats.svelte.js'
import { sttAuth } from '@stt/auth.svelte.js'
import { sttDataset } from '@stt/dataset.svelte.js'
import { dsCode, dtCode, ALL_DT } from '@svc/kind/chinese/codes'
import { localTimeZone } from '@std/format'

export interface StatsService {
  loadGroupProgressAll(datasetId: DatasetId): Promise<void>
}

async function loadGroupProgressAll(datasetId: DatasetId): Promise<void> {
  // Anon drills are never persisted (svcDrill gates writes on auth), so a local
  // read here is guaranteed empty — skip it rather than pay for the IDB walk.
  if (!sttAuth.isAuthenticated) {
    sttStats.groupProgressStroke = new Map()
    sttStats.groupProgressPinyin = new Map()
    sttStats.lessonDrilledWords = new Map()
    return
  }

  const groups = sttDataset.groups
  if (groups.length > 0) {
    try {
      const [perType, lessonProgress] = await Promise.all([
        datStats.getGroupReviewProgress(
          dsCode(datasetId),
          groups.map((g) => g.id),
          localTimeZone(),
        ),
        datStats.getLessonProgress(
          dsCode(datasetId),
          groups.map((g) => g.id),
        ),
      ])
      sttStats.groupProgressStroke = perType.s
      sttStats.groupProgressPinyin = perType.p
      sttStats.lessonDrilledWords = lessonProgress
      return
    } catch (err) {
      console.error('Failed to load server group review state:', err)
    }
  }

  // Authenticated but the RPC failed (or no groups yet) — local IDB fallback.
  const perType: Record<string, Map<number, GroupProgress>> = { s: new Map(), p: new Map() }

  for (const dt of ALL_DT) {
    const code = dtCode(dt)
    const ptMap = perType[code]
    const gp = await datStats.getGroupProgress(dsCode(datasetId), code)
    for (const [groupId, summary] of gp) {
      ptMap.set(groupId, { ...summary })
    }
  }
  sttStats.groupProgressStroke = perType.s
  sttStats.groupProgressPinyin = perType.p
  sttStats.lessonDrilledWords = await datStats.getLessonProgress(
    dsCode(datasetId),
    groups.map((g) => g.id),
  )
}

export const svcStats: StatsService = {
  loadGroupProgressAll,
}
