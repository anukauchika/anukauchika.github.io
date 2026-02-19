import type { WordId } from '@dom/dataset'
import type { WordProgress } from '@dom/stats'
import type { DrillId } from '@dom/drill'
import { sttDataset } from '@stt/dataset.svelte.js'
import { sttAuth } from '@stt/auth.svelte.js'
import { sttStats } from '@stt/kind/chinese/stats.svelte.js'
import { pickNextDrill } from '@std/kind/chinese/drill'

class DrillState {
  drillId: DrillId | null = $state(null)
  progress: Map<WordId, WordProgress> = $state(new Map())

  readonly nextDrill = $derived.by(() => {
    if (sttAuth.isAuthenticated) return pickNextDrill(
      sttDataset.filtered,
      sttStats.groupProgress,
      sttStats.groupProgressStroke,
      sttStats.groupProgressPinyin,
    )
    return sttDataset.filtered.length > 0 ? { groupId: sttDataset.filtered[0].id, type: 'stroke' as const } : null
  })
}

export const sttDrill = new DrillState()
