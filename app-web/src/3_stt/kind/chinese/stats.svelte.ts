import type { GroupId } from '@dom/dataset'
import type { GroupProgress } from '@dom/stats'
import type { ChineseGroup } from '@dom/kind/chinese/dataset'
import { sttDataset } from '@stt/dataset.svelte.js'
import { countDueDrills } from '@std/kind/chinese/stats'

class StatsState {
  // raw data (written by service)
  groupProgressStroke: Map<GroupId, GroupProgress> = $state(new Map())
  groupProgressPinyin: Map<GroupId, GroupProgress> = $state(new Map())

  // derived (reactive wiring over @std pure functions)
  private get groups(): ChineseGroup[] { return sttDataset.groups as ChineseGroup[] }

  readonly dueCount = $derived(countDueDrills(this.groups, this.groupProgressStroke, this.groupProgressPinyin))
}

export const sttStats = new StatsState()
