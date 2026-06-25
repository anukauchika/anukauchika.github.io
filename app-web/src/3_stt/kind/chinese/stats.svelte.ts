import type { GroupId, WordKey } from '@dom/dataset'
import type { DayKey, WordProgress, GroupProgress, DayProgress } from '@dom/stats'
import type { ChineseGroup } from '@dom/kind/chinese/dataset'
import { sttDataset } from '@stt/dataset.svelte.js'
import { calcDatasetStats, calcAvgDailyTime, countDrilled, calcProgress, calcMastery, countDueDrills } from '@std/kind/chinese/stats'

class StatsState {
  // raw data (written by service)
  wordProgress: Map<WordKey, WordProgress> = $state(new Map())
  wordProgressStroke: Map<WordKey, WordProgress> = $state(new Map())
  wordProgressPinyin: Map<WordKey, WordProgress> = $state(new Map())

  groupProgress: Map<GroupId, GroupProgress> = $state(new Map())
  groupProgressStroke: Map<GroupId, GroupProgress> = $state(new Map())
  groupProgressPinyin: Map<GroupId, GroupProgress> = $state(new Map())

  dayProgress: Map<DayKey, DayProgress> = $state(new Map())

  // derived (reactive wiring over @std pure functions)
  private get filtered(): ChineseGroup[] { return sttDataset.filtered as ChineseGroup[] }
  private get groups(): ChineseGroup[] { return sttDataset.groups as ChineseGroup[] }

  readonly datasetStats = $derived(calcDatasetStats(this.filtered))
  readonly dueCount = $derived(countDueDrills(this.groups, this.groupProgressStroke, this.groupProgressPinyin))
  readonly strokeDrilledCount = $derived(countDrilled(this.filtered, this.wordProgressStroke))
  readonly strokeProgress = $derived(calcProgress(this.filtered, this.wordProgressStroke))
  readonly strokeMastery = $derived(calcMastery(this.filtered, this.wordProgressStroke))
  readonly pinyinProgress = $derived(calcProgress(this.filtered, this.wordProgressPinyin))
  readonly pinyinMastery = $derived(calcMastery(this.filtered, this.wordProgressPinyin))
  readonly avgDailyTime = $derived(calcAvgDailyTime(this.dayProgress))
}

export const sttStats = new StatsState()
