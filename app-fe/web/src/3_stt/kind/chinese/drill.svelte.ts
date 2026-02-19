import type { WordId } from '@dom/dataset'
import type { WordProgress } from '@dom/stats'
import type { DrillId } from '@dom/drill'

class DrillState {
  drillId: DrillId | null = $state(null)
  progress: Map<WordId, WordProgress> = $state(new Map())
}

export const sttDrill = new DrillState()
